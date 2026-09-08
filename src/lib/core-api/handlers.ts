import "server-only";

import { createCoreSupabaseClient } from "./client";
import { getCoreApiConfig } from "./config";
import {
  createCoreResource,
  getCoreResource,
  listCoreResources,
  updateCoreResource,
} from "./data";
import { coreError, coreJson, coreResponseHeaders } from "./responses";
import { hasValidCoreAuthorization } from "./security";
import {
  isUuid,
  parsePagination,
  type CoreResource,
  validatePayload,
} from "./validation";

type DatabaseError = { code?: unknown };

function databaseErrorResponse(error: unknown) {
  const value = typeof error === "object" && error !== null ? error as DatabaseError : {};
  const code = typeof value.code === "string" ? value.code : "";

  if (code === "23505") return coreError(409, "conflict", "A resource with a unique field already exists.");
  if (code === "23503") return coreError(422, "invalid_reference", "A referenced resource does not exist.");
  if (["23502", "23514", "22001", "22007", "22P02"].includes(code)) {
    return coreError(422, "constraint_violation", "The request violates a database constraint.");
  }
  if (code === "42501") return coreError(403, "forbidden", "The requested operation is not permitted.");

  console.error("Core API database request failed", { code });
  return coreError(500, "internal_error", "The request could not be completed.");
}

async function withCoreAuthorization(
  request: Request,
  operation: () => Promise<Response>,
) {
  let expectedApiKey: string;
  try {
    expectedApiKey = getCoreApiConfig().coreApiKey;
  } catch (error) {
    console.error("Core API configuration error", error);
    return coreError(503, "service_unavailable", "Core API is not configured.");
  }

  if (!hasValidCoreAuthorization(request.headers.get("authorization"), expectedApiKey)) {
    const response = coreError(401, "unauthorized", "A valid Bearer token is required.");
    response.headers.set("WWW-Authenticate", 'Bearer realm="qairuhub-core"');
    return response;
  }

  try {
    return await operation();
  } catch (error) {
    return databaseErrorResponse(error);
  }
}

async function readJsonBody(request: Request) {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (contentType !== "application/json") {
    return { response: coreError(415, "unsupported_media_type", "Content-Type must be application/json.") };
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > 65_536) {
    return { response: coreError(413, "payload_too_large", "Request body must not exceed 64 KiB.") };
  }

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > 65_536) {
    return { response: coreError(413, "payload_too_large", "Request body must not exceed 64 KiB.") };
  }
  try {
    return { data: JSON.parse(body) as unknown };
  } catch {
    return { response: coreError(400, "invalid_json", "Request body must contain valid JSON.") };
  }
}

export function createCollectionHandlers(resource: CoreResource) {
  return {
    GET(request: Request) {
      return withCoreAuthorization(request, async () => {
        const pagination = parsePagination(request.url);
        if (!pagination.ok) {
          return coreError(400, "invalid_query", "Query parameters are invalid.", pagination.fieldErrors);
        }
        const result = await listCoreResources(
          createCoreSupabaseClient(),
          resource,
          pagination.data,
        );
        return coreJson({
          data: result.data,
          pagination: { ...pagination.data, total: result.total },
        });
      });
    },

    POST(request: Request) {
      return withCoreAuthorization(request, async () => {
        const body = await readJsonBody(request);
        if (body.response) return body.response;
        const validation = validatePayload(resource, body.data, "create");
        if (!validation.ok) {
          return coreError(422, "validation_failed", "Request body validation failed.", validation.fieldErrors);
        }
        const data = await createCoreResource(createCoreSupabaseClient(), resource, validation.data);
        const location = new URL(`${new URL(request.url).pathname}/${data.id}`, request.url);
        return coreJson({ data }, {
          status: 201,
          headers: { ...coreResponseHeaders, Location: location.toString() },
        });
      });
    },
  };
}

export function createItemHandlers(resource: CoreResource) {
  return {
    GET(request: Request, id: string) {
      return withCoreAuthorization(request, async () => {
        if (!isUuid(id)) return coreError(400, "invalid_id", "id must be a valid UUID.");
        const data = await getCoreResource(createCoreSupabaseClient(), resource, id);
        return data
          ? coreJson({ data })
          : coreError(404, "not_found", "Resource was not found.");
      });
    },

    PATCH(request: Request, id: string) {
      return withCoreAuthorization(request, async () => {
        if (!isUuid(id)) return coreError(400, "invalid_id", "id must be a valid UUID.");
        const body = await readJsonBody(request);
        if (body.response) return body.response;
        const validation = validatePayload(resource, body.data, "update");
        if (!validation.ok) {
          return coreError(422, "validation_failed", "Request body validation failed.", validation.fieldErrors);
        }
        const data = await updateCoreResource(
          createCoreSupabaseClient(),
          resource,
          id,
          validation.data,
        );
        return data
          ? coreJson({ data })
          : coreError(404, "not_found", "Resource was not found.");
      });
    },
  };
}
