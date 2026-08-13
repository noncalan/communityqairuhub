import { toast } from "sonner";
export async function shareDemo(title:string,path:string){const url=`${window.location.origin}${path}`;try{if(navigator.share)await navigator.share({title,url});else{await navigator.clipboard.writeText(url);toast.success("Link copied to clipboard");}}catch(error){if((error as Error).name!=="AbortError")toast.error("Could not share this link");}}
