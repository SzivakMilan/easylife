import { useLocation } from 'react-router-dom'
import { sectionByPath, SECTION_GRADIENTS } from '../lib/sections'

export function useSection() {
  const location = useLocation()
  const meta = sectionByPath(location.pathname)
  const colors = SECTION_GRADIENTS[meta.key]
  return { meta, colors }
}
