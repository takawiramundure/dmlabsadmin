import { useRouter } from "next/navigation";

const useGoBack = () => {
  const router = useRouter();

  const goBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      router.push(-1); // Go back to the previous page
    } else {
      router.push("/"); // Redirect to home if no history exists
    }
  };

  return goBack;
};

export default useGoBack;
