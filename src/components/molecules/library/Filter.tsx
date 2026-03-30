import { SortOption } from "../../../hooks/useEntityFilter";

export default function Filter({
  filter,
  setFilter,
  filterBy,
  setFilterBy,
  sortBy,
  setSortBy,
  placeholder,
  collection,
}: {
  filter: string;
  setFilter: (filter: string) => void;
  filterBy: string;
  setFilterBy: (filterBy: string) => void;
  sortBy?: SortOption;
  setSortBy?: (sortBy: SortOption) => void;
  placeholder: string;
  collection?: boolean;
}) {
  return (
    <div className="flex flex-col md:flex-row mt-5 gap-2">
      <div className="flex flex-row gap-2 flex-1">
        {!collection && (
          <select
            value={filterBy}
            onChange={(e) => {
              setFilter("");
              setFilterBy(e.target.value as "title" | "author" | "genre");
            }}
            className="flex-shrink-0 border border-gray-400 rounded-md p-3 bg-tertiary text-white"
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
      {!collection && setSortBy && sortBy && (
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          className="flex-shrink-0 border border-gray-400 rounded-md p-3 bg-tertiary text-white"
        >
          <option value="name_asc">Name (asc)</option>
          <option value="name_desc">Name (desc)</option>
          <option value="id_asc">Added (asc)</option>
          <option value="id_desc">Added (desc)</option>
        </select>
      )}
    </div>
  );
}

const styles = {
  input:
    "border border-gray-400 rounded-md p-3 w-full bg-input text-white",
};
