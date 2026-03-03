"use client"

import { ReactNode, useEffect, useMemo, useRef, useState } from "react"
import L from "leaflet"
import { extendContext, useLeafletContext, LeafletContext } from "@react-leaflet/core"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"

interface MarkerClusterGroupProps {
    children: ReactNode
}

export default function MarkerClusterGroup({ children }: MarkerClusterGroupProps) {
    const context = useLeafletContext()
    const clusterGroupRef = useRef<any>(null)
    const [isReady, setIsReady] = useState(false)

    // Initialize cluster group once on client
    if (!clusterGroupRef.current && typeof window !== "undefined") {
        require("leaflet.markercluster")

        clusterGroupRef.current = (L as any).markerClusterGroup({
            showCoverageOnHover: false,
            spiderfyOnMaxZoom: true,
            zoomToBoundsOnClick: true,
            animate: true,
            chunkedLoading: true,
            maxClusterRadius: 50,
            iconCreateFunction: (cluster: any) => {
                const count = cluster.getChildCount()
                let size = "w-10 h-10"
                if (count >= 10) size = "w-12 h-12"
                if (count >= 100) size = "w-14 h-14"

                let iconPx = 40
                if (count >= 10) iconPx = 48
                if (count >= 100) iconPx = 56

                return L.divIcon({
                    html: `
            <div class="${size} rounded-full flex items-center justify-center relative p-[2px] shadow-2xl transition-all duration-300 transform hover:scale-110">
              <div class="absolute inset-0 bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 rounded-full animate-pulse opacity-80"></div>
              <div class="absolute inset-[3px] bg-neutral-900 rounded-full z-10"></div>
              <div class="relative z-20 text-white font-black text-sm font-[Outfit] tracking-tighter">
                ${count}
              </div>
              <div class="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full z-30 ring-2 ring-indigo-500 animate-bounce"></div>
            </div>
          `,
                    className: "custom-cluster-icon",
                    iconSize: L.point(iconPx, iconPx),
                })
            },
        })
    }

    const clusterGroup = clusterGroupRef.current

    useEffect(() => {
        if (!clusterGroup) return

        const container = context.layerContainer || context.map
        container.addLayer(clusterGroup)
        setIsReady(true)

        return () => {
            container.removeLayer(clusterGroup)
        }
    }, [context.layerContainer, context.map, clusterGroup])

    const newContext = useMemo(() => {
        if (!clusterGroup) return context
        return extendContext(context, { layerContainer: clusterGroup })
    }, [context, clusterGroup])

    if (!isReady) return null

    return (
        <LeafletContext.Provider value={newContext}>
            {children}
        </LeafletContext.Provider>
    )
}
