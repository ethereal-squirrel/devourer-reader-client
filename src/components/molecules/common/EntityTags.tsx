export default function EntityTags({ tags }: { tags: string[] }) {
  if (!tags) {
    return null;
  }

  return (
    <div
      className={`flex flex-row flex-wrap mb-[1rem] gap-2 ${
        tags.length === 0 ? "hidden" : ""
      }`}
    >
      {tags.map((tag) => (
        <div
          key={tag}
          className="bg-primary text-white rounded-md px-2 py-1 text-sm font-semibold"
        >
          {tag}
        </div>
      ))}
    </div>
  );
}
