export default function TextNode({ data }) {
  return (
    <div
      style={{
        padding: 10,
        border: '1px solid #555',
        borderRadius: 10,
        background: 'white',
      }}
    >
      <input
        defaultValue={data.label}
      />
    </div>
  )
}