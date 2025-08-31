
export default function EditingPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Editing Video: {params.id}</h1>
      {/* Video editing form goes here */}
    </div>
  );
}
