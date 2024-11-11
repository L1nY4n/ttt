# 设备管理协议
### 协议选择：
使用UDP组播协议,组播地址为 239.255.255.250，端口 **31900**。

## 协议对象
- 客户端(Client): (搜索客户端程序)
- 设备端(Device): 各类型能通过广播发现的


### 消息流程
####  搜索设备流程
客户端发送设备发现请求消息到组播地址。
所有监听该组播地址的设备都会收到请求消息。
设备收到请求后，返回自己的设备信息到指定的源IP地址和端口号

#### 控制设备流程
发送设备控制命令到组播地址，指定需要控制的设备mac和类型
所有符合条件的设备收到命令后，执行相应的控制操作，并将结果返回给命令发起者

### 超时和重试机制
TODO

### 安全性
消息加密和认证
TODO


### 消息结构

<table style="width: 100%;">
<tbody>
<tr>
<td style="font-size: 15px; padding: 10px;"><b>2 字节</b></td>
<td style="font-size: 15px; padding: 10px;"><b>2 字节</b></td>
<td style="font-size: 15px; padding: 10px;"><b>6 字节</b></td>
<td style="font-size: 15px; padding: 10px;"><b>1 字节</b></td>
<td style="font-size: 15px; padding: 10px;"><b>4 字节</b></td>
<td style="font-size: 15px; padding: 10px;"><b>N 字节 </b></td>
</tr>
<tr>
<td>固定头</td>
<td>长度</td>
<td>设备ID(MAC)</td>
<td>设备类型</td>
<td>保留位</td>
<td>消息体</td>
</tr>
</tbody>
</table>



设备注册和响应：

###### 设备发现请求消息：
服务端:

```json
{
  "type": "discover"
}
```

设备发现响应消息：

json
复制代码
{
  "action": "discover_response",
  "device_id": "device123",
  "device_name": "Smart Device",
  "device_type": "light",
  "ip_address": "192.168.1.100",
  "port": 8080
}
设备控制消息：

json
复制代码
{
  "action": "control",
  "device_id": "device123",
  "command": "turn_on",
  "parameters": {
    "brightness": 80
  }
}
通过这样的设计，可以实现简单而有效的设备搜索和控制功能。