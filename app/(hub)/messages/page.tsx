import { Suspense } from "react";import { MessagesPage } from "@/components/demo/messages-page";
export default function Page(){return <Suspense fallback={<div className="page-container">Loading conversations…</div>}><MessagesPage/></Suspense>}
