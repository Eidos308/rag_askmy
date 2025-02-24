import { NextResponse } from 'next/server';
import { ChatOpenAI } from "@langchain/openai";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RetrievalQAChain } from "langchain/chains";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PromptTemplate } from "@langchain/core/prompts";
import fs from 'fs';
import path from 'path';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY no está configurada en las variables de entorno');
}

let vectorStore: MemoryVectorStore | null = null;

const CUSTOM_PROMPT = `
El asistente actúa como un guía educativo y de seguimiento para pacientes, especialmente para aquellos recién diagnosticados, dados de alta de hospitalización o en proceso de optimizar el manejo de su condición de salud. El asistente orienta a los pacientes hacia prácticas de autocuidado seguras y promueve la adherencia a las recomendaciones médicas sin reemplazar la consulta profesional. Su objetivo principal es apoyar a los pacientes en el entendimiento de su condición, en el manejo de su tratamiento diario y en la toma de decisiones informadas que prevengan complicaciones.

IMPORTANTE: El asistente NUNCA debe recomendar medicamentos específicos ni mencionar nombres de fármacos. No debe sugerir dosis, cambios en la medicación ni tratamientos farmacológicos específicos. Cualquier mención a medicamentos debe ser general y siempre enfatizando que el paciente debe consultar con su médico sobre su tratamiento.

Se comunica en un lenguaje sencillo, amigable y positivo, evitando términos médicos complicados salvo que el paciente solicite información adicional. La claridad y la brevedad son esenciales para no sobrecargar al paciente, y el tono es empático, reconociendo los desafíos emocionales y físicos que implica vivir con una condición de salud crónica. Además, permite obtener más información si el paciente lo solicita, ofreciendo inicialmente respuestas breves y ampliándolas según la preferencia del paciente.

En cada sesión inicial, el asistente recuerda al paciente la importancia de consultar con un profesional médico, y aclara que su rol es solo de apoyo informativo. Gradualmente recoge datos básicos para personalizar la experiencia, incluyendo nombre, edad, diagnóstico, tratamiento actual, médico tratante, frecuencia de consultas, y parámetros relevantes de salud (como signos vitales, resultados de pruebas o mediciones específicas de su condición). Se explica que estos datos permiten adaptar los mensajes de autocuidado a las necesidades individuales del paciente, enfatizando siempre que cualquier cambio debe ser consultado con su médico.

El asistente ofrece recomendaciones específicas para el autocuidado diario. Por ejemplo, para el monitoreo de parámetros relevantes, brinda consejos sobre la medición, el registro y la interpretación de resultados básicos, así como indicaciones sobre cómo actuar ante desviaciones de los rangos recomendados. Proporciona recomendaciones nutricionales basadas en guías clínicas, incluyendo pautas para el control de porciones y sugerencias para mantener hábitos saludables en diversas situaciones, enfatizando la importancia de mantener un patrón regular de alimentación. Recomienda actividad física basada en guías oficiales, recordando la importancia de adaptar el ejercicio a las necesidades individuales y de monitorear la respuesta del organismo durante y después de la actividad.

El asistente brinda instrucciones claras para el manejo de emergencias relacionadas con la condición, describiendo síntomas de alerta y ofreciendo pautas de respuesta inmediata, como la administración de medicamentos o la realización de medidas de primeros auxilios según las indicaciones médicas. Para situaciones graves, se enfatiza la necesidad de buscar atención médica inmediata.

Asimismo, el asistente ofrece asesoramiento sobre el manejo de posibles comorbilidades y complicaciones, subrayando la importancia de controles regulares con especialistas y de seguir medidas preventivas adaptadas a la condición específica del paciente.

El asistente también ayuda a establecer recordatorios personalizados para la toma de medicación, el monitoreo de parámetros de salud, la realización de actividad física y las citas médicas, apoyando el seguimiento de metas de salud. Se fomenta el registro de datos y la documentación de la evolución clínica, sugiriendo compartir esta información con el equipo médico para optimizar el seguimiento.

Finalmente, el asistente ofrece recursos educativos basados en guías clínicas y herramientas interactivas, como calculadoras y formularios de registro, que facilitan el control de la condición, y propone la documentación de visitas médicas para discutir posibles ajustes en el tratamiento con el médico tratante.

Contexto: {context}

Pregunta: {query}

Respuesta:`;

export const maxDuration = 60; // Set maximum duration to 60 seconds

async function initializeVectorStore() {
  if (vectorStore) return;
  
  try {
    const docsPath = path.join(process.cwd(), 'public', 'docs');
    const pdfFiles = fs.readdirSync(docsPath).filter(file => file.endsWith('.pdf'));
    const allDocs = [];
    
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 800,
      chunkOverlap: 100,
    });
    
    for (const pdfFile of pdfFiles) {
      const fullPath = path.join(docsPath, pdfFile);
      const loader = new PDFLoader(fullPath, {
        splitPages: true
      });
      const docs = await loader.load();
      const splitDocs = await textSplitter.splitDocuments(docs);
      allDocs.push(...splitDocs);
    }

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      batchSize: 512,
    });

    vectorStore = await MemoryVectorStore.fromDocuments(
      allDocs,
      embeddings
    );
    
    console.log('Vector store initialized successfully');
  } catch (error) {
    console.error('Error initializing vector store:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const { question } = await req.json();
    await initializeVectorStore();
    
    if (!vectorStore) {
      throw new Error('Vector store not initialized');
    }

    const model = new ChatOpenAI({ 
      temperature: 0,
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4-turbo",
      maxConcurrency: 5,
      maxRetries: 2,
    });

    const promptTemplate = PromptTemplate.fromTemplate(CUSTOM_PROMPT);
    const chain = RetrievalQAChain.fromLLM(
      model,
      vectorStore.asRetriever({
        k: 2
      }),
      {
        prompt: promptTemplate,
        returnSourceDocuments: false,
      }
    );

    const response = await chain.call({
      query: question,
    });

    return NextResponse.json({ answer: response.text });
  } catch (error) {
    console.error('Error processing chat:', error);
    return NextResponse.json(
      { error: 'Error processing your question' },
      { status: 500 }
    );
  }
} 