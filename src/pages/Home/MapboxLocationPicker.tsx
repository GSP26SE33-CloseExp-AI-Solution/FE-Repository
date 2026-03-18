import { useEffect, useRef } from "react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

type Props = {
    lat: number
    lng: number
    onPick: (value: { lat: number; lng: number }) => void
    onMapStatusChange?: (status: "loading" | "loaded" | "error") => void
}

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || ""

const MapboxLocationPicker = ({
    lat,
    lng,
    onPick,
    onMapStatusChange,
}: Props) => {
    const containerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const markerRef = useRef<mapboxgl.Marker | null>(null)

    const onPickRef = useRef(onPick)
    const onMapStatusChangeRef = useRef(onMapStatusChange)

    useEffect(() => {
        onPickRef.current = onPick
    }, [onPick])

    useEffect(() => {
        onMapStatusChangeRef.current = onMapStatusChange
    }, [onMapStatusChange])

    useEffect(() => {
        if (!containerRef.current) return
        if (mapRef.current) return

        if (!mapboxgl.accessToken) {
            onMapStatusChangeRef.current?.("error")
            return
        }

        try {
            onMapStatusChangeRef.current?.("loading")

            const map = new mapboxgl.Map({
                container: containerRef.current,
                style: "mapbox://styles/mapbox/streets-v12",
                center: [lng, lat],
                zoom: 15,
            })

            map.addControl(new mapboxgl.NavigationControl(), "top-right")

            const marker = new mapboxgl.Marker({ draggable: true })
                .setLngLat([lng, lat])
                .addTo(map)

            marker.on("dragend", () => {
                const pos = marker.getLngLat()
                onPickRef.current({ lat: pos.lat, lng: pos.lng })
            })

            map.on("click", (e) => {
                const nextLat = e.lngLat.lat
                const nextLng = e.lngLat.lng
                marker.setLngLat([nextLng, nextLat])
                onPickRef.current({ lat: nextLat, lng: nextLng })
            })

            map.on("load", () => {
                onMapStatusChangeRef.current?.("loaded")
            })

            map.on("error", () => {
                onMapStatusChangeRef.current?.("error")
            })

            mapRef.current = map
            markerRef.current = marker
        } catch {
            onMapStatusChangeRef.current?.("error")
        }

        return () => {
            mapRef.current?.remove()
            mapRef.current = null
            markerRef.current = null
        }
    }, [])

    useEffect(() => {
        if (!mapRef.current || !markerRef.current) return

        markerRef.current.setLngLat([lng, lat])

        mapRef.current.flyTo({
            center: [lng, lat],
            zoom: Math.max(mapRef.current.getZoom(), 15),
            essential: true,
        })
    }, [lat, lng])

    return (
        <div className="overflow-hidden rounded-2xl border border-sky-100 shadow-sm">
            <div ref={containerRef} className="h-[320px] w-full" />
        </div>
    )
}

export default MapboxLocationPicker
