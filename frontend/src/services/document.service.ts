import { api } from "@/lib/api"

export const documentService = {
  upload: async(formData: FormData)=>{
    const {data} = await api.post('/document/upload',formData,{
      headers:{
        'Content-Type':'multipart/form-data',
      },
    });
    return data;
  },

  getDocuments: async(workspaceId?:string)=>{
    const url = workspaceId ? `/document?workspaceId=${workspaceId}` :'/documents';
    const {data} = await api.get(url);
    return data;
  }
}