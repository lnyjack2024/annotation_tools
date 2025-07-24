import qs from "qs";
import { useLocation } from "@umijs/max";

export default function useLocationWithQuery(queryOptions?: qs.IParseOptions) {
  const location = useLocation();
  return {
    ...location,
    query: qs.parse(
      location.search,
      queryOptions || { ignoreQueryPrefix: true }
    ),
  };
}
