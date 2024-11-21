"use client"

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type InputType = 'text' | 'url' | 'vcard'

interface VCardData {
  name: string
  phone: string
  email: string
}

export default function QRAC() {
  const [activeTab, setActiveTab] = useState<InputType>('text')
  const [textInput, setTextInput] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [vcardInput, setVcardInput] = useState<VCardData>({ name: '', phone: '', email: '' })
  const [qrCodeData, setQRCodeData] = useState('')

  const handleGenerate = () => {
    switch (activeTab) {
      case 'text':
        setQRCodeData(textInput)
        break
      case 'url':
        setQRCodeData(urlInput)
        break
      case 'vcard':
        const vcard = `BEGIN:VCARD
VERSION:3.0
FN:${vcardInput.name}
TEL:${vcardInput.phone}
EMAIL:${vcardInput.email}
END:VCARD`
        setQRCodeData(vcard)
        break
    }
  }

  const handleDownload = () => {
    const svg = document.getElementById('qr-code')
    if (svg) {
      const svgData = new XMLSerializer().serializeToString(svg)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx?.drawImage(img, 0, 0)
        const pngFile = canvas.toDataURL('image/png')
        const downloadLink = document.createElement('a')
        downloadLink.download = 'qrcode.png'
        downloadLink.href = pngFile
        downloadLink.click()
      }
      img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
        <div>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as InputType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="text">Text</TabsTrigger>
            <TabsTrigger value="url">URL</TabsTrigger>
            <TabsTrigger value="vcard">vCard</TabsTrigger>
          </TabsList>
          <TabsContent value="text" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="text-input">Enter text</Label>
              <Input
                id="text-input"
                placeholder="Enter text for QR code"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
              />
            </div>
          </TabsContent>
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-input">Enter URL</Label>
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
              />
            </div>
          </TabsContent>
          <TabsContent value="vcard" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name-input">Name</Label>
              <Input
                id="name-input"
                placeholder="John Doe"
                value={vcardInput.name}
                onChange={(e) => setVcardInput({ ...vcardInput, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone-input">Phone</Label>
              <Input
                id="phone-input"
                type="tel"
                placeholder="+1234567890"
                value={vcardInput.phone}
                onChange={(e) => setVcardInput({ ...vcardInput, phone: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-input">Email</Label>
              <Input
                id="email-input"
                type="email"
                placeholder="john@example.com"
                value={vcardInput.email}
                onChange={(e) => setVcardInput({ ...vcardInput, email: e.target.value })}
              />
            </div>
          </TabsContent>
        </Tabs>
        <Button onClick={handleGenerate} className="w-full">Generate QR Code</Button>
        {qrCodeData && (
          <div className="space-y-4">
            <div className="flex justify-center">
              <QRCodeSVG
                id="qr-code"
                value={qrCodeData}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <Button onClick={handleDownload} className="w-full">Download QR Code</Button>
          </div>
        )}
        </div>
    </div>
  )
}