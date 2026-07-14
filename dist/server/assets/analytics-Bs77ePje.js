import { redirect } from "@tanstack/react-router";
const SplitComponent = () => redirect({
  to: "/queue"
});
export {
  SplitComponent as component
};
