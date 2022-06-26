// import { CHAIN_ID } from 'config/constants/chains'
// import SwiperProvider from 'contexts/SwiperProvider'
import React from 'react'
import { useActiveWeb3React } from 'services/web3'
import LaunchCalendar from './components/LaunchCalendar/LaunchCalendar'
// import News from './components/News/News'
// import Services from './components/Services/Services'
import StatCards from './components/StatCards/StatCards'
import TrendingTokens from './components/TrendingTokens/TrendingTokens'
// import Values from './components/Values/Values'
import WelcomeContent from './components/WelcomeContent/WelcomeContent'
import { Banner } from './styles'

const Home: React.FC = () => {
  const { chainId } = useActiveWeb3React()

  return (
    <>
      <Banner />
      <WelcomeContent />
      <StatCards />
      <TrendingTokens />
      {/* <SwiperProvider>
         <News />
      </SwiperProvider>
      {chainId === 250 && (
         <SwiperProvider>
           <Services />
        // </SwiperProvider>
      )} */}
      {/* <SwiperProvider> */}
        {/* <Values /> */}
      {/* </SwiperProvider> */}
      {/* <SwiperProvider> */}
        <LaunchCalendar />
      {/* </SwiperProvider> */}
    </>
  )
}

export default React.memo(Home)