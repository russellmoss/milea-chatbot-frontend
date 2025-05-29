import axios from "axios";

export async function getClientIp() {
  const res = await axios.get("https://api.ipify.org/?format=json");
  const ip = res.data.ip || "unknown";
  return ip;
}