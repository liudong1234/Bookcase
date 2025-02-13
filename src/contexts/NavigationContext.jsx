import { createContext, useContext, useState } from 'react'

const NavigationContext = createContext()

export const NavigationProvider = ({ children }) => {
  const [currentPosition, setPosition] = useState(null)
  const [isLoading, setLoading] = useState(false)
  const [navigationHandler, setHandler] = useState(null)

  const value = {
    currentPosition,
    isLoading,
    navigationHandler,
    
    initialize: (handler) => {
      setHandler(handler)
      setPosition(handler.getInitialPosition())
    },

    navigateTo: async (target) => {
      setLoading(true)
      try {
        const newPos = await handler.goTo(target)
        setPosition(newPos)
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  )
}

export const useNavigation = () => useContext(NavigationContext)