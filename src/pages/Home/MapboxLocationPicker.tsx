import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type Props = {
    lat: number;
    lng: number;
    onPick: (value: { lat: number; lng: number }) => void;
    onMapStatusChange?: (status: "loading" | "loaded" | "error") => void;
};

const MAPBOX_TOKEN = (process.env.REACT_APP_MAPBOX_TOKEN ?? "").trim();
mapboxgl.accessToken = MAPBOX_TOKEN;

const MapboxLocationPicker = ({
    lat,
    lng,
    onPick,
    onMapStatusChange,
}: Props) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markerRef = useRef<mapboxgl.Marker | null>(null);
    const [mapLoadFailed, setMapLoadFailed] = useState(false);

    const onPickRef = useRef(onPick);
    const onMapStatusChangeRef = useRef(onMapStatusChange);

    useEffect(() => {
        onPickRef.current = onPick;
    }, [onPick]);

    useEffect(() => {
        onMapStatusChangeRef.current = onMapStatusChange;
    }, [onMapStatusChange]);

    useEffect(() => {
        if (!containerRef.current) return;
        if (mapRef.current) return;

        if (!MAPBOX_TOKEN) {
            onMapStatusChangeRef.current?.("error");
            return;
        }

        try {
            setMapLoadFailed(false);
            onMapStatusChangeRef.current?.("loading");

            const map = new mapboxgl.Map({
                container: containerRef.current,
                style: "mapbox://styles/mapbox/streets-v12",
                center: [lng, lat],
                zoom: 15,
            });

            map.addControl(new mapboxgl.NavigationControl(), "top-right");

            const marker = new mapboxgl.Marker({ draggable: true })
                .setLngLat([lng, lat])
                .addTo(map);

            marker.on("dragend", () => {
                const pos = marker.getLngLat();
                onPickRef.current({ lat: pos.lat, lng: pos.lng });
            });

            map.on("click", (e) => {
                const nextLat = e.lngLat.lat;
                const nextLng = e.lngLat.lng;
                marker.setLngLat([nextLng, nextLat]);
                onPickRef.current({ lat: nextLat, lng: nextLng });
            });

            map.on("load", () => {
                onMapStatusChangeRef.current?.("loaded");
            });

            map.on("error", () => {
                setMapLoadFailed(true);
                onMapStatusChangeRef.current?.("error");
            });

            mapRef.current = map;
            markerRef.current = marker;
        } catch {
            setMapLoadFailed(true);
            onMapStatusChangeRef.current?.("error");
        }

        return () => {
            mapRef.current?.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!mapRef.current || !markerRef.current) return;

        markerRef.current.setLngLat([lng, lat]);

        mapRef.current.flyTo({
            center: [lng, lat],
            zoom: Math.max(mapRef.current.getZoom(), 15),
            essential: true,
        });
    }, [lat, lng]);

    if (!MAPBOX_TOKEN) {
        return (
            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/40 shadow-sm">
                <div className="flex h-[320px] flex-col items-center justify-center gap-2 px-5 text-center">
                    <div className="text-[14px] font-semibold text-slate-900">
                        Chưa cấu hình Mapbox
                    </div>
                    <p className="text-[12px] font-medium leading-5 text-slate-600">
                        Thêm biến{" "}
                        <span className="font-mono text-[11px]">
                            REACT_APP_MAPBOX_TOKEN
                        </span>{" "}
                        (token public dạng pk.&hellip;) vào file{" "}
                        <span className="font-mono text-[11px]">.env</span> ở
                        thư mục gốc FE, rồi khởi động lại dev server.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-2xl border border-sky-100 shadow-sm">
            <div ref={containerRef} className="h-[320px] w-full" />
            {mapLoadFailed ? (
                <div className="border-t border-red-100 bg-red-50/60 px-3 py-2 text-[12px] font-medium text-red-700">
                    Không tải được bản đồ. Kiểm tra token Mapbox, quota hoặc kết
                    nối mạng, rồi tải lại trang.
                </div>
            ) : null}
        </div>
    );
};

export default MapboxLocationPicker;
