export default function Filter({
  filter,
  setFilter,
  filterBy,
  setFilterBy,
  placeholder,
  collection,
}: {
  filter: string;
  setFilter: (filter: string) => void;
  filterBy: string;
  setFilterBy: (filterBy: string) => void;
  placeholder: string;
  collection?: boolean;
}) {
  return (
    <div className="flex flex-row mt-5">
      {!collection && (
        <select
          value={filterBy}
          onChange={(e) => {
            setFilter("");
            setFilterBy(e.target.value as "title" | "author" | "genre");
          }}
          className="flex-shrink-1 border border-gray-400 border-r-0 rounded-md rounded-r-none p-3 bg-tertiary text-white"
        >
          <option value="title">Title</option>
          <option value="author">Author</option>
          <option value="genre">Genre</option>
        </select>
      )}
      <input
        placeholder={placeholder}
        className={styles.input}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />
    </div>
  );
}

const styles = {
  input:
    "border border-gray-400 rounded-md rounded-l-none p-3 w-full bg-input text-white",
};
