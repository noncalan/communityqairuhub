import { EventDetail } from "@/components/demo/detail-pages";
export default async function Page({params}:{params:Promise<{slug:string}>}){const{slug}=await params;return <EventDetail slug={slug}/>}
