import InfinityIcon from "../../../assets/infinity.svg";

export const LoadingState = () => (
  <div className="flex flex-col items-center justify-center h-full w-full md:w-1/2 md:mx-auto">
    <div className="flex items-center justify-center">
      <img src={InfinityIcon} alt="Loading" />
    </div>
  </div>
);
