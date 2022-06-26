import axios from 'axios'
import { LiveIfo } from 'config/types'
import { baseUrlStrapi } from 'hooks/api'

const fetchIfoStatusFromApi = async (): Promise<LiveIfo[]> => {
  try {
    const liveIfoResult = await axios.get(`${baseUrlStrapi}/navbar-settings`)
    const res = liveIfoResult.data[0].settings

    return res
  } catch (error) {
    console.error('fetchIfoStatusFromApiError::', error)
    return null
  }
}

export default fetchIfoStatusFromApi
