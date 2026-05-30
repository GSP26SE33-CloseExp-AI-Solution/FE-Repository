const DEFAULT_DEV_API_ORIGIN = "http://localhost:5014";

/** Backend origin without trailing slash or `/api` suffix. */
export const getApiOrigin = (): string => {
	const raw = (process.env.REACT_APP_API_URL ?? "").trim();

	if (raw) {
		return raw.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
	}

	if (process.env.NODE_ENV === "development") {
		return DEFAULT_DEV_API_ORIGIN;
	}

	return "";
};

/** Axios base URL, e.g. `http://localhost:5014/api`. */
export const getApiBaseUrl = (): string => {
	const origin = getApiOrigin();
	return origin ? `${origin}/api` : "/api";
};
