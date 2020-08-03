module Reach.CompilerTool where

import qualified Filesystem.Path.CurrentOS as FP
import Reach.Compiler
import Reach.CompilerNL (compileNL)
import System.Directory

data CompilerToolOpts = CompilerToolOpts
  { cto_outputDir :: FilePath
  , cto_source :: FilePath
  , cto_expCon :: Bool
  , cto_expComp :: Bool
  , cto_verifier :: Verifier
  }

makeCompilerOpts :: CompilerToolOpts -> IO CompilerOpts
makeCompilerOpts CompilerToolOpts {..} = do
  let srcp = cto_source
  let outd = cto_outputDir
  let outdp = FP.decodeString outd
  let outn ext = FP.encodeString $ FP.append outdp $ (FP.filename $ FP.decodeString srcp) `FP.replaceExtension` ext
  let out ext con = do writeFile (outn ext) con
  createDirectoryIfMissing True outd
  return $
    CompilerOpts
      { output = out
      , output_name = outn
      , source = srcp
      , expCon = cto_expCon
      , verifier = cto_verifier
      }

compilerToolMain :: CompilerToolOpts -> IO ()
compilerToolMain ctool_opts@CompilerToolOpts {..} = do
  copts <- makeCompilerOpts ctool_opts
  case cto_expComp of
    True -> compileNL copts
    False -> compile copts
