/**
 * WebMCP declarative API attributes (https://developer.chrome.com/docs/ai/webmcp/declarative-api).
 * Not in Astro's HTML types yet; browsers without WebMCP ignore them. See DECISIONS.md.
 */
declare namespace astroHTML.JSX {
  interface FormHTMLAttributes {
    toolname?: string | null;
    tooldescription?: string | null;
    toolautosubmit?: boolean | null;
  }
  interface InputHTMLAttributes {
    toolparamdescription?: string | null;
  }
  interface SelectHTMLAttributes {
    toolparamdescription?: string | null;
  }
  interface TextareaHTMLAttributes {
    toolparamdescription?: string | null;
  }
}
