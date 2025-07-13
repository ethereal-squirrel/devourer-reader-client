export const Container = ({
  children,
  ...props
}: { children: React.ReactNode } & any) => {
  return (
    <div className={`${styles.container} ${props.className}`} {...props}>
      {children}
    </div>
  );
};

const styles = {
  container: "p-3 min-h-screen w-full flex flex-col",
};
