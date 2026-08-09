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

  triggerWebsiteCrawl: async (workspaceId: string, sourceUrl: string) => {
    const response = await api.post(`/documents/${workspaceId}/crawl`, { sourceUrl });
    return response.data;
  },

  getDocuments: async(workspaceId?:string)=>{
    const url = workspaceId ? `/documents?workspaceId=${workspaceId}` :'/documents';
    const response = await api.get(url);
    return response.data.data.documents;
  },
  
  deleteDocument: async (documentId: string) => {
    const response = await api.delete(`/documents/${documentId}`, {
      responseType: 'blob' 
    });
    return response; 
  }
}