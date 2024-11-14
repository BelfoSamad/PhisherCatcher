# In-Device Check (Preview)

The main project currently faces a major problem: **Should the extension check every website even well known ones?**. This is issue is covered in a primitive solution checking if the checked domain name exists in a hard-coded list of well known domain names. The list is too small and narrow and it misses a lot of well-known websites.

The newly available approach (in Experimental phase) is an In-device Large Language Model through **Gemini Nano** within Chrome. At this stage Gemini Nano will be only used to check if a domain name is well known or not, and in a future more stable releases it can move into a fully localized website legitimacy check.

# How does it work!

PhisherCatcher currently works with a hybrid approach checking the website through different stages:

- 1/ Check with **Chrome Built-in AI** if the website is well known or not.
- 2/ In case of a negative response or an issue, it fallback into the original primitive check (checking website with a pre-defined hardcoded list).
- 3/ In case after both checks the extension still doesn't recognize the website as legit (well-known). It does the online check through (1 - checking the database for already saved records then 2 - does the check with the deployed Gemini agent)

# Issues

Currently this approach is on alpha and requires a lot of work to be added. Here's some of the issues faced...

- Currently **Chrome Built-in Ai** is only on Chrome Dev/Canary channels and not yet stable.
- The model doesn't generate structured outputs so the check is based on the model answering by either _Yes_ or _No_
  - Currently the model throws an error when the answer is _No_ for some reason (``)
  - That's why the extension assumes that every output that doesn't equal "_Yes_" or a crash as the website not being recognized as a well known website and continues with the primitive check.
- Other model related crashes like: model not being properly loaded, unknwonErrors...etc.

# The Plan

- Make the current approach stable (after the release of the stable version of **Chrome Built-in Ai**)
- Improve on the approach on multiple stages
  - Properly detect all possible cases: well known legit/scam, potentially legit/scam
  - Do parts of the check within the extension then passing the pre-analysis report to the 
  - Do the whole check within the extension (locally)
