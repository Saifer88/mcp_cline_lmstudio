declare module "pdf-parse" {
  interface PdfData {
    numpages: number;
    numrender: number;
    info: Record<string, any>;
    metadata: Record<string, any> | null;
    text: string;
    version: string;
  }

  function pdf(dataBuffer: Buffer, options?: Record<string, any>): Promise<PdfData>;
  export default pdf;
}
