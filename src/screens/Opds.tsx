import OpdsConnect from "../components/organisms/common/OpdsConnect";
import { TabBar } from "../components/organisms/common/TabBar";
import { Container } from "../components/templates/Container";
import { useServer } from "../hooks/useServer";

export default function OpdsScreen() {
  const { loading } = useServer();

  return (
    <div className="h-screen flex flex-col bg-secondary">
      <Container className="flex-1 px-5 pb-24 pt-8">
        <div className="flex flex-col items-center justify-center h-full w-full md:w-1/2 md:mx-auto">
          <OpdsConnect />
        </div>
      </Container>
      {!loading && <TabBar />}
    </div>
  );
}
