import { api } from "@/lib/api"

export const documentService = {
  upload: async(formData: FormData)=>{
    const response = await api.post('/documents/upload',formData,{
      headers:{
        'Content-Type':'multipart/form-data',
      },
    });
    return response.data;
  },

  getDocuments: async(workspaceId?:string)=>{
    const url = workspaceId ? `/documents?workspaceId=${workspaceId}` :'/documents';
    const response = await api.get(url);
    return response.data.data.documents;
  }
}