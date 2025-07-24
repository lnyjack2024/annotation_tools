export default function InnerHtml({ content }: { content: string }) {
  return (
    <div
      dangerouslySetInnerHTML={{ __html: content }}
      className="editor-content-img w-e-text"
    />
  );
}
