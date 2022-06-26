import { useEffect } from 'react'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import useRefresh from 'hooks/useRefresh'

import { AppDispatch, AppState } from '.'
import { HomepageData, HomepageTokenStats, LaunchCalendarCard, NewsCardType, ServiceData, State } from './types'
import { fetchHomepageData, fetchHomepageLaunchCalendar, fetchHomepageNews, fetchHomepageService, fetchHomepageTokenData } from './stats'

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<AppState> = useSelector

export const useFetchHomepageStats = (isFetching: boolean) => {
  const dispatch = useAppDispatch()
  const { slowRefresh } = useRefresh()

  useEffect(() => {
    if (isFetching) {
      dispatch(fetchHomepageData())
    }
  }, [slowRefresh, isFetching, dispatch])
}

export const useHomepageStats = (): HomepageData => {
  const homepageStats = useSelector((state: State) => state.stats.HomepageData)
  return homepageStats
}

export const useHomepageLaunchCalendar = (): LaunchCalendarCard[] => {
    const homepageLaunchCalendar = useSelector((state: State) => state.stats.HomepageLaunchCalendar)
    return homepageLaunchCalendar
  }
  
  export const useFetchHomepageLaunchCalendar = (isFetching: boolean) => {
    const dispatch = useAppDispatch()
    const { slowRefresh } = useRefresh()
  
    useEffect(() => {
      if (isFetching) {
        dispatch(fetchHomepageLaunchCalendar())
      }
    }, [slowRefresh, isFetching, dispatch])
  }

  export const useFetchHomepageNews = (isFetching: boolean) => {
    const dispatch = useAppDispatch()
    const { slowRefresh } = useRefresh()
  
    useEffect(() => {
      if (isFetching) {
        dispatch(fetchHomepageNews())
      }
    }, [slowRefresh, isFetching, dispatch])
  }

  export const useHomepageNews = (): NewsCardType[] => {
    const homepageNews = useSelector((state: State) => state.stats.HomepageNews)
    return homepageNews
  }
  
  export const useFetchHomepageTokenStats = (isFetching: boolean, category: string) => {
    const dispatch = useAppDispatch()
    const { slowRefresh } = useRefresh()
  
    useEffect(() => {
      if (isFetching) {
        dispatch(fetchHomepageTokenData(category))
      }
    }, [slowRefresh, isFetching, category, dispatch])
  }
  
  export const useHomepageTokenStats = (): HomepageTokenStats[] => {
    const homepageTokenStats = useSelector((state: State) => state.stats.HomepageTokenStats)
    return homepageTokenStats
  }

  export const useFetchHomepageServiceStats = (isFetching: boolean) => {
    const dispatch = useAppDispatch()
    const { slowRefresh } = useRefresh()
  
    useEffect(() => {
      if (isFetching) {
        dispatch(fetchHomepageService())
      }
    }, [slowRefresh, isFetching, dispatch])
  }
  
  export const useHomepageServiceStats = (): ServiceData[] => {
    const homepageServiceStats = useSelector((state: State) => state.stats.HomepageServiceStats)
    return homepageServiceStats
  }