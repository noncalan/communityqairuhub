"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CampusEvent, Community, DemoNotification, DemoPost, DemoState, Project, Resource } from "@/types";

const STORAGE_KEY = "qairu-hub-demo:v2";

export const demoPosts: DemoPost[] = [
  { id:"nlp-directory", authorUsername:"temirlan", context:"AI & Machine Learning", createdAt:"18 min", text:"Shared a first version of the Kazakh NLP dataset directory. I’ve documented licensing and baseline tasks — missing sources are welcome.", tags:["NLP","Open data"], likes:24, communitySlug:"ai-ml" },
  { id:"community-fair", authorUsername:"kamila", context:"Community Fair", createdAt:"1 h", text:"Community Fair registrations are open. Founding club leads: please confirm your table and one five-minute activity by Monday.", tags:["Campus","Founding cohort"], likes:31 },
  { id:"campus-map", authorUsername:"daniyar", context:"Open Campus Map", createdAt:"3 h", text:"We now have accessible routes for the north building. Looking for two people to test directions on mobile before Friday.", tags:["Project update","Accessibility"], likes:18 },
];

export const demoNotifications: DemoNotification[] = [
  { id:"n-project", kind:"project", text:"Amina invited you to join Peer Mentor", meta:"Project invitation · 12 min", href:"/projects/peer-mentor" },
  { id:"n-comment", kind:"comment", text:"Temirlan commented on your post in AI & Machine Learning", meta:"28 min", href:"/home?post=nlp-directory" },
  { id:"n-follow", kind:"follow", text:"Daniyar started following you", meta:"1 h", href:"/u/daniyar" },
  { id:"n-event", kind:"event", text:"AI Build Night starts tomorrow at 18:30", meta:"Event reminder · 2 h", href:"/events/ai-build-night" },
  { id:"n-like", kind:"like", text:"Students liked your QAIRU Python starter repository", meta:"5 h", href:"/resources?resource=python-starter" },
  { id:"n-community", kind:"community", text:"Design Community welcomed you", meta:"Yesterday", href:"/communities/design-community" },
];

const initialState: DemoState = {
  version:2,
  profile:{ name:"Aruzhan Sarsembayeva", username:"aruzhan", program:"Artificial Intelligence", year:1, bio:"Building useful ML tools and helping shape QAIRU's first student community.", skills:["Python","PyTorch","Product"], interests:["AI","Startups"], available:true },
  createdPosts:[], createdProjects:[], createdCommunities:[], createdEvents:[], createdResources:[],
  likedPostIds:[], bookmarkedPostIds:[], comments:{}, followedUsernames:[], joinedCommunitySlugs:[], attendingEventSlugs:[], savedEventSlugs:[], savedProjectSlugs:[], savedOpportunityIds:[], savedResourceIds:[], projectApplications:{},
  conversations:[
    { username:"daniyar", unread:1, messages:[{id:"m1",sender:"them",text:"Hi! I saw your AI Study Assistant update.",createdAt:"10:08"},{id:"m2",sender:"me",text:"We’re mapping the first onboarding flow now.",createdAt:"10:12"},{id:"m3",sender:"them",text:"Yes, I can review it tonight.",createdAt:"10:14"}] },
    { username:"amina", unread:1, messages:[{id:"m4",sender:"them",text:"Shared a new project update",createdAt:"09:42"}] },
    { username:"sabina", unread:0, messages:[{id:"m5",sender:"them",text:"See you at the workshop!",createdAt:"Yesterday"}] },
    { username:"dias", unread:0, messages:[{id:"m6",sender:"them",text:"The room changed to 2.04",createdAt:"Tue"}] },
  ],
  readNotificationIds:["n-community"],
  notificationPreferences:{projects:true,events:true,communityDigest:false},
  privacy:{profileVisibility:"campus",messagePermission:"everyone",projectInvitations:true}, reduceMotion:false,
};

type DemoContextValue = {
  state: DemoState; hydrated: boolean;
  toggleIn: (key: keyof Pick<DemoState,"likedPostIds"|"bookmarkedPostIds"|"followedUsernames"|"joinedCommunitySlugs"|"attendingEventSlugs"|"savedEventSlugs"|"savedProjectSlugs"|"savedOpportunityIds"|"savedResourceIds">, id:string) => void;
  createPost:(post:DemoPost)=>void; addComment:(postId:string,text:string)=>void;
  createProject:(project:Project)=>void; createCommunity:(community:Community)=>void; createEvent:(event:CampusEvent)=>void; createResource:(resource:Resource)=>void;
  applyToProject:(slug:string,role:string,message:string)=>void; sendMessage:(username:string,text:string)=>void; openConversation:(username:string)=>void;
  markNotification:(id:string)=>void; markAllNotifications:()=>void;
  updateProfile:(profile:DemoState["profile"])=>void; updatePreferences:(values:Partial<Pick<DemoState,"notificationPreferences"|"privacy"|"reduceMotion">>)=>void;
};

const DemoContext = createContext<DemoContextValue | null>(null);
const makeId = (prefix:string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

export function DemoStateProvider({children}:{children:React.ReactNode}) {
  const [state,setState] = useState(initialState);
  const [hydrated,setHydrated] = useState(false);
  useEffect(()=>{
    /* eslint-disable react-hooks/set-state-in-effect -- deliberate safe post-mount localStorage hydration */
    try { const raw=localStorage.getItem(STORAGE_KEY); if(raw){const saved=JSON.parse(raw) as Partial<DemoState>; if(saved.version===2)setState({...initialState,...saved,profile:{...initialState.profile,...saved.profile},notificationPreferences:{...initialState.notificationPreferences,...saved.notificationPreferences},privacy:{...initialState.privacy,...saved.privacy}});} } catch { localStorage.removeItem(STORAGE_KEY); }
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  },[]);
  useEffect(()=>{if(hydrated)localStorage.setItem(STORAGE_KEY,JSON.stringify(state));},[hydrated,state]);
  const change=useCallback((fn:(current:DemoState)=>DemoState)=>setState(fn),[]);
  const toggleIn=useCallback<DemoContextValue["toggleIn"]>((key,id)=>change(current=>{const list=current[key] as string[];return {...current,[key]:list.includes(id)?list.filter(x=>x!==id):[...list,id]};}),[change]);
  const value=useMemo<DemoContextValue>(()=>({state,hydrated,toggleIn,
    createPost:post=>change(s=>({...s,createdPosts:[post,...s.createdPosts]})),
    addComment:(postId,text)=>change(s=>({...s,comments:{...s.comments,[postId]:[...(s.comments[postId]??[]),{id:makeId("comment"),authorUsername:s.profile.username,text,createdAt:"Just now"}]}})),
    createProject:project=>change(s=>({...s,createdProjects:[project,...s.createdProjects]})),
    createCommunity:community=>change(s=>({...s,createdCommunities:[community,...s.createdCommunities]})),
    createEvent:event=>change(s=>({...s,createdEvents:[event,...s.createdEvents]})),
    createResource:resource=>change(s=>({...s,createdResources:[resource,...s.createdResources]})),
    applyToProject:(slug,role,message)=>change(s=>({...s,projectApplications:{...s.projectApplications,[slug]:{role,message}}})),
    sendMessage:(username,text)=>change(s=>{const message={id:makeId("message"),sender:"me" as const,text,createdAt:new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})};const existing=s.conversations.find(x=>x.username===username);return {...s,conversations:existing?s.conversations.map(x=>x.username===username?{...x,unread:0,messages:[...x.messages,message]}:x):[{username,unread:0,messages:[message]},...s.conversations]};}),
    openConversation:username=>change(s=>({...s,conversations:s.conversations.some(x=>x.username===username)?s.conversations.map(x=>x.username===username?{...x,unread:0}:x):[{username,unread:0,messages:[]},...s.conversations]})),
    markNotification:id=>change(s=>({...s,readNotificationIds:s.readNotificationIds.includes(id)?s.readNotificationIds:[...s.readNotificationIds,id]})),
    markAllNotifications:()=>change(s=>({...s,readNotificationIds:demoNotifications.map(x=>x.id)})),
    updateProfile:profile=>change(s=>({...s,profile})),
    updatePreferences:values=>change(s=>({...s,...values})),
  }),[change,hydrated,state,toggleIn]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoState(){const value=useContext(DemoContext);if(!value)throw new Error("useDemoState must be inside DemoStateProvider");return value;}
export function slugify(value:string){return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||`item-${Date.now()}`;}
