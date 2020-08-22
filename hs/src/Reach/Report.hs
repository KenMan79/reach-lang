module Reach.Report (Report, startReport) where

import Data.Aeson
import Data.Time
import Control.Concurrent
import Control.Concurrent.Async
import Control.Exception
import Control.Monad.Reader
import Data.Fixed (Pico)
import Network.HTTP.Client.Conduit (httpNoBody)
import Network.HTTP.Client.TLS
import Network.HTTP.Conduit
import Network.HTTP.Simple (setRequestBodyJSON, setRequestMethod)
import Reach.Version

reportUrl :: String
reportUrl = "https://log.reach.sh/submit"

successGracePeriodMicroseconds :: NominalDiffTime -> Int
successGracePeriodMicroseconds elapsed =
  max one_sec $ min one_sec $ picoToMicroInt $ nominalDiffTimeToSeconds elapsed * graceFactor
  where
    graceFactor = 0.1
    -- Note: fromEnum on Pico overflows the Int at 100s of days,
    -- but our use case is seconds/mins which should be fine.
    picoToMicroInt (p :: Pico) = fromEnum $ p / picosInMicro
    picosInMicro = 1_000_000
    one_sec = 10_000_000

--- FIXME change this to map of show-able things?
type Report = Either SomeException ()

startReport :: Maybe String -> IO (Report -> IO ())
startReport mwho = do
  startTime <- getCurrentTime
  let who = case mwho of
              Just x -> x
              Nothing -> show startTime
  req <- parseRequest reportUrl
  manager <- newManager tlsManagerSettings
  let req' = setRequestMethod "POST" req

  --- FIXME we want to start the TCP/IP & HTTP handshake right now, so
  --- we send a dummy request that will be rejected by the logger, so
  --- that the manager will start a keep-alive connection, so that at
  --- the end, things will go fast.
  _ignored <- async . void $
    flip runReaderT manager $ do
    let log_req = setRequestBodyJSON (object []) req'
    void $ httpNoBody log_req
  
  return $ \what -> do
    endTime <- getCurrentTime
    let elapsed = diffUTCTime endTime startTime
    let (result, mtimeout) =
          case what of
            Left exn -> (("error: " <> show exn), Nothing)
            Right () -> ("success", Just $ successGracePeriodMicroseconds elapsed)
    let rep =
          object
          [ "userId" .= who
          , "startTime" .= startTime
          , "version" .= version
          , "elapsed" .= elapsed
          , "result" .= result ]

    m <- async . void $
      flip runReaderT manager $ do
        let log_req = setRequestBodyJSON rep req'
        void $ httpNoBody log_req

    let block = waitCatch m
    case mtimeout of
      Nothing -> void block
      Just usecs -> do
        ba <- async block
        tda <- async (threadDelay usecs)
        waitEither_ ba tda