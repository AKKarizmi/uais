import OperationsWorkspace from '@/components/operations/workspace'
export default async function Page({params}: {params: Promise<{id:string}>}) { const {id}=await params; return <OperationsWorkspace screen="students" studentId={id} /> }
