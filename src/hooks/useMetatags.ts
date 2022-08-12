import { useEffect } from 'react'

import setMetatags from 'features/crosschain/services/metatags'

export const useMetatags = (data: any) => {
  useEffect(() => {
    setMetatags(data)
  }, [])
}