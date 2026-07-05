import { createFrameworkRouter } from "./frameworks/default-router.js";

const router = createFrameworkRouter();

console.log(router.list());

const react = router.get("react-vite");

console.log(react.name);
