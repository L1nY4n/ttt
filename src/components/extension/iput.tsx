"use client"

import React, { useState, useEffect, useRef } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface IPutProps {
  defaultValue?: string
  onChange?: (ip: string) => void
  isError?: (ip: string) => boolean
  className?: string
}

const isValidIPItemValue = (val: number) => !isNaN(val) && val >= 0 && val <= 255

export default function IPut({ defaultValue = '...', onChange = () => {}, isError = () => false, className = '' }: IPutProps) {
  const [value, setValue] = useState<(number | string)[]>([])
  const inputRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)]

  useEffect(() => {
    const initialValue = Array.isArray(defaultValue) ? defaultValue : defaultValue.split('.')
    setValue(initialValue)
  }, [defaultValue])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const val = parseInt(e.target.value)
    if (isNaN(val) && e.target.value !== '') {
      return
    }

    const newValue = [...value]
    newValue[i] = isValidIPItemValue(val) ? val : 255

    setValue(newValue)
    onChange(newValue.join('.'))

    if (!isNaN(val) && val.toString().length === 3 && i < 3) {
      inputRefs[i + 1].current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if ((e.key === 'ArrowLeft' || e.key === 'Backspace') && (e.target as HTMLInputElement).selectionStart === 0 && i > 0) {
      inputRefs[i - 1].current?.focus()
    }
    if (e.key === 'ArrowRight' && (e.target as HTMLInputElement).selectionEnd === (e.target as HTMLInputElement).value.length && i < 3) {
      inputRefs[i + 1].current?.focus()
    }
    if (e.key === '.') {
      e.preventDefault()
      if (i < 3) {
        inputRefs[i + 1].current?.focus()
      }
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, i: number) => {
    e.preventDefault()
    const pasteData = e.clipboardData.getData('text/plain')
    const pasteValues = pasteData.split('.').map(v => parseInt(v))

    if (pasteValues.length !== 4 - i || !pasteValues.every(isValidIPItemValue)) {
      return
    }

    const newValue = [...value]
    pasteValues.forEach((val, j) => {
      newValue[i + j] = val
    })

    setValue(newValue)
    onChange(newValue.join('.'))
  }

  const ipString = value.map(val => isNaN(Number(val)) ? '' : val).join('.')
  const errorClass = isError(ipString) ? 'border-red-500' : ''

  return (
    <div className="space-y-2">
      <Label htmlFor="ip-input">IP Address</Label>
      <div className={`flex items-center space-x-2 ${className}`}>
        {value.map((val, i) => (
          <div key={i} className="flex items-center">
            <Input
              id={i === 0 ? "ip-input" : undefined}
              ref={inputRefs[i]}
              type="text"
              value={isNaN(Number(val)) ? '' : val}
              onChange={(e) => handleChange(e, i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              onPaste={(e) => handlePaste(e, i)}
              className={`w-14 text-center ${errorClass}`}
              maxLength={3}
            />
            {i !== 3 && <span className="text-lg">.</span>}
          </div>
        ))}
      </div>
      {isError(ipString) && <p className="text-sm text-red-500">Please enter a valid IP address</p>}
    </div>
  )
}