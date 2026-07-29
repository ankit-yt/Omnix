import { create } from "zustand";

interface chatState{
  isHistoryView: boolean;
  activeSessionId:string| null;
  activeWorkspaceId:string | null;
  setActiveWorkspaceId:(id:string | null)=>void
  setHistoryView:(view:boolean) => void;
  setActiveSessionId:(id:string| null)=>void;
  resetChatState:()=>void;
}

export const useChatStore = create<chatState>((set)=>({
  isHistoryView:true,
  activeSessionId:null,
  activeWorkspaceId:null,
  setActiveWorkspaceId:(id)=>set({activeWorkspaceId:id}),
  setHistoryView:(view)=>set({isHistoryView:view}),
  setActiveSessionId:(id)=>set({activeSessionId:id}),
  resetChatState:()=>set({isHistoryView:false, activeSessionId:null})

}))