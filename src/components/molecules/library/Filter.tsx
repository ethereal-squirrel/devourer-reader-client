export default function Filter({
  filter,
  setFilter,
  placeholder,
}: {
  filter: string;
  setFilter: (filter: string) => void;
  placeholder: string;
}) {
  return (
    <div className="mt-5">
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
  input: "border border-gray-400 rounded-md p-3 w-full bg-input text-white",
};
