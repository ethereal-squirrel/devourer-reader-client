import { useNavigate } from "react-router";
import { useShallow } from "zustand/react/shallow";
import { toast } from "react-toastify";

import { useOpdsStore } from "../store/opds";

interface OpdsLink {
  rel: string;
  href: string;
  type: string;
}

interface OpdsFeed {
  id: string;
  title: string;
  updated: string;
  entries: any;
  links: any;
}

export function useOpds() {
  const {
    setOpdsUrl,
    setOpdsLibraries,
    setOpdsBooks,
    opdsLibraries,
    opdsUrl,
    opdsPage,
    opdsLimit,
    setNextLink,
    setPrevLink,
  } = useOpdsStore(
    useShallow((state) => ({
      setOpdsUrl: state.setOpdsUrl,
      setOpdsLibraries: state.setOpdsLibraries,
      setOpdsBooks: state.setOpdsBooks,
      opdsLibraries: state.opdsLibraries,
      opdsUrl: state.opdsUrl,
      opdsPage: state.opdsPage,
      opdsLimit: state.opdsLimit,
      setNextLink: state.setNextLink,
      setPrevLink: state.setPrevLink,
    }))
  );
  const navigate = useNavigate();

  const parseXmlToJson = (xmlString: string): Document => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, "text/xml");

    // Check for parsing errors
    const parserError = xmlDoc.querySelector("parsererror");
    if (parserError) {
      console.error("XML content around error:", xmlString.substring(0, 2000));
      throw new Error("XML parsing failed: " + parserError.textContent);
    }

    // Also check if we got a valid feed element
    const feedElement = xmlDoc.querySelector("feed");
    if (!feedElement) {
      console.error(
        "No feed element found. Document structure:",
        xmlDoc.documentElement?.tagName
      );
      console.error("XML content:", xmlString.substring(0, 1000));
    }

    return xmlDoc;
  };

  const extractOpdsData = (xmlDoc: Document): OpdsFeed => {
    const feed = xmlDoc.querySelector("feed");
    if (!feed) {
      throw new Error("Invalid OPDS feed: no feed element found");
    }

    // Extract basic feed info
    const feedData: OpdsFeed = {
      id: feed.querySelector("id")?.textContent || "",
      title: feed.querySelector("title")?.textContent || "",
      updated: feed.querySelector("updated")?.textContent || "",
      entries: [],
      links: [],
    };

    // Extract feed-level links (for pagination, navigation, etc.)
    const feedLinkElements = feed.querySelectorAll("link");
    feedData.links = Array.from(feedLinkElements).map((link) => ({
      rel: link.getAttribute("rel") || "",
      href: link.getAttribute("href") || "",
      type: link.getAttribute("type") || "",
    }));

    // Extract entries (libraries or books)
    const entries = feed.querySelectorAll("entry");

    feedData.entries = Array.from(entries).map((entry): any => {
      const links: OpdsLink[] = [];

      const linkElements = entry.querySelectorAll("link");
      links.push(
        ...Array.from(linkElements).map((link) => ({
          rel: link.getAttribute("rel") || "",
          href: link.getAttribute("href") || "",
          type: link.getAttribute("type") || "",
        }))
      );

      return {
        id: entry.querySelector("id")?.textContent || "",
        title: entry.querySelector("title")?.textContent || "",
        updated: entry.querySelector("updated")?.textContent || "",
        content: entry.querySelector("content")?.textContent || "",
        links,
      };
    });

    return feedData;
  };

  const getLibraries = async (url: string): Promise<any[]> => {
    const response = await fetch(url);
    const xmlData = await response.text();

    const xmlDoc = parseXmlToJson(xmlData);
    const feedData = extractOpdsData(xmlDoc);

    // Filter for library entries (subsection links)
    return feedData.entries.filter((entry: any) =>
      entry.links.some((link: any) => link.rel === "subsection")
    );
  };

  const getBooks = async (libraryUrl: string): Promise<any> => {
    const response = await fetch(libraryUrl);
    const xmlData = await response.text();
    const xmlDoc = parseXmlToJson(xmlData);
    const feedData = extractOpdsData(xmlDoc);

    // Get pagination links and resolve them to absolute URLs
    const baseUrl = new URL(libraryUrl);
    const nextLink = feedData.links.find((link: any) => link.rel === "next");
    const prevLink = feedData.links.find((link: any) => link.rel === "prev");

    setNextLink(nextLink ? new URL(nextLink.href, baseUrl).toString() : null);
    setPrevLink(prevLink ? new URL(prevLink.href, baseUrl).toString() : null);

    // Filter for book entries (acquisition links)
    return {
      books: feedData.entries.filter((entry: any) =>
        entry.links.some(
          (link: any) => link.rel === "http://opds-spec.org/acquisition"
        )
      ),
      nextPage: nextLink ? new URL(nextLink.href, baseUrl).toString() : null,
      prevPage: prevLink ? new URL(prevLink.href, baseUrl).toString() : null,
    };
  };

  const getBooksByPage = async (libraryUrl: string): Promise<any> => {
    const books = await getBooks(libraryUrl);
    setOpdsBooks(books);
    return true;
  };

  const getOpdsLibrary = async (id: string) => {
    const targetLibrary =
      opdsLibraries &&
      ((opdsLibraries as any[]).find(
        (library: any) => library.id === id
      ) as any);

    if (!targetLibrary) {
      toast.error("Library not found.", {
        position: "bottom-right",
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
      });
      throw new Error("Library not found");
    }

    const libraryLink = (targetLibrary as any).links.find(
      (link: any) => link.rel === "subsection"
    );

    if (!libraryLink) {
      toast.error("Library link not found.", {
        position: "bottom-right",
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
      });
      throw new Error("Library link not found");
    }

    const baseUrl = new URL(opdsUrl || "");
    const absoluteLibraryUrl = new URL(libraryLink.href, baseUrl).toString();

    const books = await getBooks(
      absoluteLibraryUrl + `?page=${opdsPage}&limit=${opdsLimit}`
    );

    setOpdsBooks(books);

    await new Promise((resolve) => setTimeout(resolve, 50));
    navigate("/library-opds");

    return { library: targetLibrary, books };
  };

  const connectToOpds = async (url: string) => {
    try {
      const libraries = await getLibraries(url);

      if (libraries.length > 0) {
        setOpdsLibraries(libraries);
        setOpdsUrl(url);

        navigate("/libraries-opds");
        return true;
      }

      setOpdsBooks([]);
      return { libraries, books: [] };
    } catch (error) {
      setOpdsBooks([]);
      setOpdsLibraries([]);
      setOpdsUrl(null);
      toast.error("No libraries found at this URL.", {
        position: "bottom-right",
        style: {
          backgroundColor: "#111827",
          color: "#fff",
        },
      });
      console.error("Error connecting to OPDS:", error);
      throw error;
    }
  };

  return {
    connectToOpds,
    getLibraries,
    getOpdsLibrary,
    getBooks,
    getBooksByPage,
    parseXmlToJson,
    extractOpdsData,
  };
}
