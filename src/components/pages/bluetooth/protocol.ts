/* 蓝牙mesh网关北向通信协议_V1.1.4






	广州市捍御者信息科技有限公司
文档说明
文档变更历史：
版本	描述	修订人	修订日期
0.0.1	新建	仇勇刚	2023/4/1
1.0.0	初版	仇勇刚	2023/10/7
1.0.1	增加网关网络相关设置、重启接口定义；
增加节能灯遥控组网使能、心跳接口定义；	仇勇刚	2023/11/30
1.0.2	修改状态查询指令操作编码；
修改若干处描述错误；	仇勇刚	2023/12/4
1.0.3	扩展查询节能灯状态信息接口；
修改下发Mqtt服务配置接口；
增加场景模式相关接口；
增加组内联动开关接口；
扩展开关灯控制定义，增加闪烁控制；
增加出厂默认参数说明；
增加相邻组跨组联动的接口；	仇勇刚	2023/12/27
1.0.4	扩展网关设备信息查询接口；
增加网关设备Mesh组网信息查询接口；
增加mesh设备类型字段定义；	仇勇刚	2024/1/2
1.1.0	扩展和修改节能灯状态信息查询接口；
修改网关的设置Mqtt服务接口，增加订阅主题项；
扩展场景切换接口，实现消防场景切换和恢复；
修改节能灯Mesh组网信息查询接口为节能灯组网管理信息查询接口；
增加节能灯组网管理信息管理接口；
增加从网关查询灯具列表和被选中灯列表接口；
增加联动车道联动使能接口；
删除原设置相邻组跨组联动开关状态接口；
修改能耗信息查询接口；
增加联动组联动开关查询接口；	仇勇刚	2024/1/12
1.1.1	修改心跳上报默认配置
扩展节能灯状态信息查询接口；
修改节能列表查询接口；
修改节能灯组网管理信息查询接口；
默认场景不允许修改；
能耗上报自动上报接口；
扩展增加/修改/删除节能灯组网管理信息接口	仇勇刚	2024/1/30
1.1.2	扩展增加/修改/删除节能灯组网管理信息接口(增加网关地址配置，作用于心跳和能耗上报)；
扩展节能灯组网管理信息查询接口(增加网关地址查询)；
修改查询节能灯列表接口；	仇勇刚	2024/2/5
1.1.3	增加智能联动模式参数设置接口；
扩展增加/修改/删除节能灯组网管理信息接口(增加智能联动学习地址删除)；
扩展节能灯组网管理信息查询接口(增加智能联动学习地址查询)；
修改查询节能灯状态查询接口（增加联动模式和联动数量查询）；	仇勇刚	2024/2/5
1.1.4	默认心跳周期改为180秒；
修改设置网关网络配置接口（增加dhcp）；
网关默认使用dhcp获取ip；
增加设置网关DNS配置接口；
修改查询节能灯列表接口；	仇勇刚	2024/2/30



目  录
1. 范围	1
2. 协议基础	1
2.1. 通信方式	1
2.2. Topic	1
2.3. JSON字段	2
3. 数据传输	4
3.1. 与网关设备交互命令	4
3.1.1. 网关设备OTA升级	4
3.1.2. BLE Mesh设备OTA升级	6
3.1.3. 查询网关设备信息	8
3.1.4. 设置网关网络配置	9
3.1.5. 设置Mqtt服务	10
3.1.6. 网关重启指令	11
3.1.7. 查询网关设备Mesh组网信息	12
3.1.8. 查询节能灯列表	13
3.1.9. 设置网关DNS	15
3.2. 与BLE Mesh设备交互命令	16
3.2.1. 设置节能灯亮度	16
3.2.2. 开关灯控制指令	17
3.2.3. 通知节能灯进行OTA升级	18
3.2.4. 查询节能灯设备状态信息	19
3.2.5. 节能灯无人时关灯延时时长设置指令	21
3.2.6. 节能灯运行模式设置指令	22
3.2.7. 节能灯遥控组网使能设置指令	22
3.2.8. 设置节能心跳上报周期	23
3.2.9. 节能灯心跳上报	24
3.2.10. 增加/修改/删除节能灯组网管理信息	24
3.2.11. 查询节能灯设备组网管理信息	26
3.2.12. 切换节能灯使用场景指令	29
3.2.13. 查询节能灯当前运行场景模式	30
3.2.14. 修改/增加节能灯场景模式定义指令	31
3.2.15. 删除节能灯场景控制定义指令	33
3.2.16. 查询节能灯已定义的场景模式	33
3.2.17. 设置组内联动开关状态	35
3.2.18. 设置能耗上报周期	36
3.2.19. 查询节能灯能耗信息	37
3.2.20. 设置联动组联动开关状态	38
3.2.21. 查询联动组联动开关状态	39
3.2.22. 设置智能联动模式参数	40
4. 设备出厂默认参数	41
4.1. 节能灯Turbo ESL-BM-T81200(S)	41
4.2. 蓝牙Mesh网关 Turbo GW-BM-TCP-1	42


1.范围
本通信协议规定了蓝牙mesh网关（简称网关）与上层平台（简称平台）之间的通讯协议与数据格式，包括协议基础、通信连接、协议分类与说明及数据格式。与蓝牙Mesh网关处于同一个BLE Mesh网络的设备（如物联网节能灯），通过蓝牙Mesh网关设备与上层平台实现数据交互。
 
2.协议基础
2.1.通信方式
本通信协议是网关与平台的通用通信协议，支持MQTT协议连接第三方MQTT物联网平台（如EMQ、mosquitto等）实现数据上传和远程控制，采用MQTT协议版本v3.1.1，网关与平台交互使用JSON格式数据，MQTT QOS使用0。
2.2.Topic
每个网关设备有两个MQTT的主题，具体如下：
上行消息主题（网关发送到平台）： 
/application/GW-BM-TCP/device/xxxxxxxxx/up
下行消息主题（平台发送到网关）： 
可配置，默认值为：
/application/GW-BM-TCP/device/xxxxxxxxx/down，其中xxxxxxxxx为设备的ID号；
电信版本的默认值为 device_control
网关设备和平台订阅这两个topic后，进行命令交互。


2.3.JSON字段
名称	类型	说明
opcode	int	操作编码，0x00~0x3F用与BLE Mesh设备（如节能灯）交互，0x40~0x5F用于与网关设备交互，具体定义参加数据传输章节的指令说明部分
mesh_dev_type	int	Mesh设备的类型，接口里不传默认表示节能灯设备。
0：节能灯
其他设备类型待扩展
value	string或int	与操作编码对应的内容值
version	int	设备版本号，一个字节
dest_addr	int16	用于下行消息，BLE Mesh设备（如节能灯）地址，包括单播和组播（如分区、车道组、相邻组、全网）地址，地址范围0x0001~0xFFFF。
src_addr	int16	用于上行消息，BLE Mesh设备（如节能灯）地址，地址范围0x0001~0x7FFF
ota_data_index	int	用于下行消息，ota时固件文件该数据包索引，第一个包的索引为为0，0~ 65535
ota_pack_count	int	用于下行消息，ota时固件文件总数据包数
ota_byte_size	int	用于下行消息，ota时固件文件该数据包字节数
ota_total_size	int	用于下行消息，ota时固件文件总数据字节数
ipaddr	string	网关设备网络地址
netmask	string	网关设备网络地址掩码
gateway	string	网关设备网络配置的网关ip
mqtt_addr	string	mqtt服务网络地址
mqtt_port	int	mqtt服务端口号
mqtt_useranme	string	mqtt服务用户名
mqtt_password	string	mqtt服务用户密码
mqtt_subscribe_topic	string	mqtt订阅topic
running_duration	int32	通电时长，秒
light_on_duration	int32	亮灯时长，秒
power	int	最大功率，瓦
energy_consumption	int	实际能耗，千瓦时
dev_model	string	产品型号
value_array	array	列表对象
array_total_size	int	列表总尺寸
index_from	int	传输列表的数据开始索引，包含
index_to	int	传输列表的数据结束索引，不包含
group_addr	int16	组地址，范围如下：
区：(addr) >= 0xE000 && (addr) <= 0xE0FF
相邻组：(addr) >= 0xE100 && (addr) <= 0xEFFF
车道组：(addr) >= 0xF000 && (addr) <= 0xFDFF
其他组：(addr) >= 0xFE00 && (addr) <= 0xFF00
duration_begin	int32	时长统计区间的开始时间



3.数据传输
网关和平台订阅相关网关设备的MQTT主题，通过MQTT消息进行数据传输。
假设网关的设备ID为11112345，则订阅的主题为/application/GW-BM-TCP/device/11112345/up和application/GW-BM-TCP/device/11112345/down。平台通过application/GW-BM-TCP/device/11112345/down主题发送消息给网关设备，网关通过application/GW-BM-TCP/device/11112345/up主题发送消息给平台；
3.1.与网关设备交互命令
3.1.1.网关设备OTA升级
网关设备OTA升级过程包括以下几个交互过程：
1.平台下发指令，请求网关进行OTA升级新版本；
2.网关设备回复平台是否进行升级；
3.如果网关设备同意进行升级，平台下发固件数据包（多条）,网关收完最后一条固件数据包消息后，将立刻自动完成升级和重启；
以上步骤对应的交互命令见以下说明。
3.1.1.1.请求网关OTA升级新版本
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x40	请求网关OTA升级新版本
version	int	0x00~0xFF	新固件的版本号，一个字节
ota_pack_count	int		固件文件总数据包数
ota_total_size	int		固件文件总数据字节数

3.1.1.2.网关回复OTA升级新版本的请求
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x41	网关回复OTA升级新版本的请求
value	int	0~1	0：当前不能升级
1：可以进行升级

3.1.1.3.平台下发固件数据包
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x42	网关OTA升级固件文件数据包
value	String		升级固件文件数据包内容，将byte转为string形式，每个byte占2位。
如当前包要传递固件文件内容为0x05 0x3F 0x04 0x11，转成传递string形式的value为”053F0411”，本文其他处所述bytehex转string形式均是上述含义。
ota_data_index	int	0~ 65535	固件文件该数据包索引，从0开始
ota_byte_size	int	1~400	固件文件该数据包字节数。
除去最后一个包按实际的字节数，前面的包都按400个字节一个包封装传递
version	int	0x00~0xFF	当前升级的新固件的版本号，需要与前面的“请求网关OTA升级新版本”指令中的版本一样，否则数据不会被处理。

3.1.2.BLE Mesh设备OTA升级
通过网关设备为下层BLE Mesh设备进行OTA升级包括以下几个交互过程：
1.平台下发指令，请求网关接收BLE Mesh设备的升级新版本固件；
2.网关设备回复平台是否进行接收；
3.如果网关设备同意进行接收，平台下发固件数据包（多条）,网关收完最后一条固件数据包消息后，将固件文件保存到flash中，用于后面给BLE Mesh设备提供升级固件；
以上步骤对应的交互命令见以下说明。
3.1.2.1.请求网关接收BLE Mesh设备OTA升级新版本固件
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x43	请求网关接收BLE Mesh设备OTA升级新版本固件
mesh_dev_type	int	可选	mesh设备类型，定义参见JSON字段说明，不传时表示为节能灯，下同。
version	int	0x00~0xFF	新固件的版本号，一个字节
ota_pack_count	int		固件文件总数据包数
ota_total_size	int		固件文件总数据字节数

3.1.2.2.网关回复接收BLE Mesh设备OTA升级新版本固件的请求
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x44	网关回复接收BLE Mesh设备OTA升级新版本固件的请求
mesh_dev_type	int	可选	mesh设备类型
value	int	0~1	0：当前不能接收
1：可以进行接收

3.1.2.3.平台下发BLE Mesh设备固件数据包
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x45	BLE Mesh设备固件文件数据包
mesh_dev_type	int	可选	mesh设备类型
value	String	必须	升级固件文件数据包内容，将byte转为String，每个byte占2位。
如当前包要传递固件文件内容为0x05 0x3F 0x04 0x11，转成传递的value为”053F0411”
ota_data_index	int	0~ 65535	固件文件该数据包索引，从0开始
ota_byte_size	int	1~400	固件文件该数据包字节数。
除去最后一个包按实际的字节数，前面的包都按400个字节一个包封装传递
version	int	0x00~0xFF	当前接收的新固件的版本号，需要与前面的“请求网关接收BLE Mesh设备OTA升级新版本固件”指令中的版本一样，否则数据不会被处理。

3.1.3.查询网关设备信息
3.1.3.1.查询网关设备信息
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x46	查询网关设备信息

3.1.3.2.网关回复设备信息
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x47	网关回复查询网关设备版本的请求
version	string		网关设备当前版本号，一个字节，转成String形式，如版本0x10，发送“10”
dev_model	string		网关产品的型号
dev_id	string		网关产品的设备ID
3.1.4.设置网关网络配置
3.1.4.1.下发网关网络配置
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x48	设置网关网络配置
ipaddr	string	必选	设备ip地址，如“192.168.0.100”
netmask	string	必选	设备ip地址掩码，如“255.255.255.0”
gateway	string	必选	地址网关，如“192.168.0.1”
dhcp	int	0或1	0表示使用下发的网络配置；
1表示使用dhcp动态获取ip
举例，开启dhcp：
{
  "opcode": 72,
  "ipaddr": "192.168.101.150",
  "netmask": "255.255.254.0",
  "gateway": "192.168.100.1",
  "dhcp": 1
}
3.1.4.2.网关回复网络设置结果
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x49	网关回复设置网络配置的结果
value	string		“00”：执行失败
“01”：执行成功
注意：设置的网络配置需要重启蓝牙网关设备才能生效。
3.1.5.设置Mqtt服务
3.1.5.1.下发Mqtt服务配置
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x4A	设置Mqtt服务配置
mqtt_addr	string	必选	服务ip地址或域名，如“192.168.0.200”或者“broker-cn.emqx.io”，使用域名时必须正确配置DNS才能正常访问服务。
mqtt_port	Int	必选	服务端口
mqtt_client_id	string	必选	Mqtt客户端id，最大长度50
mqtt_useranme	string	可选	Mqtt服务登录用户，最大长度50
mqtt_password	string	可选	Mqtt服务登录密码，最大长度100
mqtt_subscribe_topic	string	必选	Mqtt订阅主题，最大长度50

3.1.5.2.网关回复Mqtt服务配置结果
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x4B	网关回复设置Mqtt服务配置的结果
value	string		“00”：执行失败
“01”：执行成功
注意：设置的网络配置需要重启蓝牙网关设备才能生效。

3.1.6.网关重启指令
3.1.6.1.下发网关重启指令
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x4C	网关重启指令

3.1.6.2.网关回复重启结果
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x4D	网关回复重启的结果
value	string		“00”：执行失败
“01”：执行成功

3.1.7.查询网关设备Mesh组网信息
3.1.7.1.查询网关设备Mesh组网信息
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x4E	查询网关设备Mesh组网信息

3.1.7.2.网关回复设备信息
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x4F	网关回复网关设备Mesh组网信息
value	string		网关设备当前Mesh地址，2个字节，转成String形式。如果未配网，则地址0。 

3.1.8.查询节能灯列表
3.1.8.1.查询节能灯列表指令
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x50	查询节能灯列表
value	int	0~255	要查询的内容，一个字节
0：查询全部节能灯
1：查询遥控选中节能灯
后续可扩展

3.1.8.2.回复节能灯列表指令
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x51	网关回复节能灯列表
value	int	0~255	0：返回全部节能灯，该查询返回结果首次2秒后回复，之后每5秒回复一次，直到最后5秒没收到新的数据。
1：返回遥控选中节能灯
array_total_size	int	0~500	列表元素的总数量，可能分多条消息返回。 一个网关最多支持上报500个节能灯列表。
value_array	array	字符串形式数组	节能灯数组，最多200个，大于200时分多条消息返回。值由大端方式2字节mesh地址+2字节防火区地址+2字节车道组地址+6字节mac转字符串，参见下面的举例。
index_from	int		本次返回元素的起始索引，包含
index_to	int		本次返回元素的结束索引，不包含
举例：返回列表结果包含6个节能灯,第一条数据的设备的mesh地址0x0007，防火区0xE000,车道组地址0xF000，mac{0xDC,0xDA,0x0C,0xA1,0xB8,x92}，返回的字符串值0007E000F000DCDA0CA1B892
{
  "opcode": 81,
  "value": 0,
  "value_array": [
    "0007E000F000DCDA0CA1B892",
    "0005E000F000DCDA0CA1B80E",
    "0004E000F000DCDA0CA1B882",
    "0008E000F000DCDA0CA1B88A",
    "0002E000F000DCDA0CA1B876",
    "0006E000F000DCDA0CA1B866"
  ],
  "array_total_size": 6,
  "index_from": 0,
  "index_to": 6
}

3.1.9.设置网关DNS
3.1.9.1.下发网关DNS配置
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x52	设置网关网络配置
dns1	string	必选	首选DNS地址，如“114.114.114.114”
dns2	string	必选	备选DNS地址，如“8.8.8.8”
举例如下：
{
  "opcode": 82,
  "dns1": "114.114.114.114",
  "dns2": "8.8.8.8"
}
3.1.9.2.网关回复DNS设置结果
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x53	网关回复设置网络配置的结果
value	string		“00”：执行失败
“01”：执行成功
注意：设置的DNS配置需要重启蓝牙网关设备才能生效。

3.2.与BLE Mesh设备交互命令
3.2.1.设置节能灯亮度
3.2.1.1.设置节能灯无人时的亮度
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x00	设置节能灯无人时的亮度
mesh_dev_type	int	0	mesh设备类型，定义参见JSON字段说明，不传时表示为节能灯，下同。
value	int	0~100	无人时的亮度百分比，0为不亮，100为全亮
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.1.2.设置节能灯有人时的亮度
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x01	设置节能灯有人时的亮度
mesh_dev_type	int	0	mesh设备类型
value	int	0~100	有人时的亮度百分比，0为不亮，100为全亮
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.2.开关灯控制指令
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x05	节能灯开关控制
mesh_dev_type	int	0	mesh设备类型
value	int	0~2	0：关灯
1：开灯
2：闪烁
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.3.通知节能灯进行OTA升级
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x11	通知节能灯进行OTA升级
mesh_dev_type	int	0	mesh设备类型
value	int		指定的固件版本，一个字节
0：升级到Mesh网络已有的最新版本；
1~255：升级到该指定的版本
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.4.查询节能灯设备状态信息
3.2.4.1.查询节能灯状态信息指令
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x1C	查询节能灯设备信息
mesh_dev_type	int	0	mesh设备类型
value	int	0~255	要查询的内容，一个字节
0：查询版本
1：查询运行模式
2：查询有人和无人时的亮度
3：查询无人时关灯延时时长
4：查询遥控组网使能状态
5：查询心跳间隔
6：查询组内联动开关状态（指自己感应到有人信号时，是否触发车道组和相邻组内其他灯点亮）
7：查询节能灯开关状态
8：查询mac地址
9：查询联动模式，以及智能联动模式下的联动跳数
11：查询能耗上报间隔
255：保留，用于网关查询在线设备，收到的回复报文不进行北向转发
后续可扩展

dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.4.2.回复节能灯设备状态信息
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x1D	回复节能灯设备状态信息
mesh_dev_type	int	0	mesh设备类型
value	string		要查询的内容和设备状态值，11字节（hex转string形式），第一个字节为要查询的内容（与“查询节能灯状态信息指令”中定义相同），后面的字节为状态值。 
byte1为0时：byte2为版本，后面忽略；
byte1为1时：byte2为运行模式，后面忽略；
byte1为2时：byte2为有人亮度，byte3为无人时的亮度，后面忽略；
byte1为3时：byte2为无人时关灯延时时长，后面忽略；
byte1为4时：byte2为遥控组网使能状态，后面忽略；
byte1为5时：byte2为心跳间隔（0表示不上报心跳），后面忽略；
byte1为6时：byte2为组内联动开关状态，后面忽略；
byte1为7时：byte2为节能灯的开关状态，后面忽略；
byte1为8时：byte2~byte7为节能灯的mac地址；
byte1为9时：byte2为组联动模式（0），或智能联动模式下的联动跳数（1~10）；
byte1为11时：byte2为能耗上报间隔（单位小时，0表示不主动上报），后面忽略；
byte1为255时：byte2~byte3为防火区地址，byte4~byte5为车道组地址，byte6~byte11为节能灯的mac地址，网关查询在线设备,数据不会转发到平台；
后续可扩展
src_addr	int	0x0001~0xFFFF	节能灯的Mesh地址

3.2.5.节能灯无人时关灯延时时长设置指令
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x15	节能灯感应模式下，从有人到感到无人时关灯延时时长设置
mesh_dev_type	int	0	mesh设备类型
value	int	5~255	关灯的延时时长，单位为秒
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.6.节能灯运行模式设置指令
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x17	节能灯的运行模式设置
mesh_dev_type	int	0	mesh设备类型
value	int	2或者3	2：工程模式
3：感应模式
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.7.节能灯遥控组网使能设置指令
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x19	节能灯的运行设置
mesh_dev_type	int	0	mesh设备类型
value	int	0或者1	0：不可通过遥控进行组网配置修改
1：可通过遥控进行组网配置修改
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.8.设置节能心跳上报周期
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x1A	节能灯的心跳周期设置
mesh_dev_type	int	0	mesh设备类型
value	int	0或者30~180	0：不上报心跳
30~180：心跳上报周期，单位秒
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.9.节能灯心跳上报
心跳上报时，设备将优先往指定的网关地址上报，如果未指定，则设备自主选择路径更短的网关上报。
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x1B	回复节能灯设备状态信息
mesh_dev_type	int	0	mesh设备类型
value	string		3个字节hex转string形式
byte1：开关状态,0为关，1为开，2为闪烁；
byte2：运行模式，2工程模式，3感应模式；
byte3：固件版本；
src_addr	int	0x0001~0xFFFF	节能灯的Mesh地址
3.2.10.增加/修改/删除节能灯组网管理信息
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x33	节能灯增加/修改/删除组网管理信息
mesh_dev_type	int	0	mesh设备类型
value	int		组网管理信息操作类型，1字节，含义如下：
0：表示删除区
1：表示增加或修改区
2：表示删除车道组
3：表示增加或修改车道组
4：表示删除相邻组
5：表示增加或修改相邻组
6：表示删除其他组
7：表示增加其他组
8：表示删除联动组
9：表示增加联动组
10：表示删除上报网关设置
11：表示增加或修改上报网关，未设置网关地址时，设备将自动选择上报网关的地址
12：表示删除智能联动模式识别的相邻灯地址
后续可扩展
注：其他组和联动组不支持修改操作，只能先删除后增加，列表已满的情况下，增加操作将失败。
group_addr	int16		组地址或网关地址，范围如下：
区：(addr) >= 0xE000 && (addr) <= 0xE0FF
相邻组：(addr) >= 0xE100 && (addr) <= 0xEFFF
车道组：(addr) >= 0xF000 && (addr) <= 0xFDFF
其他组：(addr) >= 0xFE00 && (addr) <= 0xFF00
联动组：为其他车道组
网关地址：节能灯主动上报报文的目的地址
注：删除其他组、联动组或智能联动模式识别的相邻灯地址的操作时，传入0xFFFF，表示删除对应组的全部内容，否则删除传入的地址；删除区、车道组、相邻组、上报网关地址时，该传入参数无效；
网关地址设置成0或者0xFFFF时，效果同删除网关地址的设置
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址
举例，设置车道组0xF002 (十进制61442)：
{
"opcode": 51,
"value":3,
"group_addr":61442,
"dest_addr":65535
}

3.2.11.查询节能灯设备组网管理信息
3.2.11.1.查询节能灯组网管理信息指令
命令方向
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x1E	查询节能灯组网管理信息
mesh_dev_type	int	0	mesh设备类型
value	int	0~255	要查询的内容，一个字节
0：查询分区地址、车道分组地址、相邻组地址
1：查询其他组地址列表
2：查询联动组地址列表
3：查询主动上报报文的网关地址
4：查询智能联动模式识别的相邻灯地址列表
后续可扩展
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.11.2.回复节能灯组网管理信息
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x1F	回复节能灯管理组网信息
mesh_dev_type	int	0	mesh设备类型
value	string		要查询的内容和设备状态值，11字节（hex转string形式），第一个字节为要查询的内容（与“查询节能灯Mesh组网信息指令”中定义相同），后面的字节为状态值。 
byte1为0时：byte2~3为分区地址，byte4~5为车道分组地址，byte6~7为相邻组地址，FFFF和0000填充地址忽略；
byte1为1时：byte2~11为5个其他组地址列表，FFFF和0000填充地址忽略；
byte1为2时：byte2~11为5个联动组地址列表，其中FFFF和0000填充地址忽略；
byte1为3时：byte2~3为设置的主动上报报文（如心跳）的网关地址，byte4~5为自动选择的网关地址，FFFF和0000填充地址忽略；
byte1为4时：byte2~9为智能联动模式识别的4个相邻灯地址列表，FFFF和0000填充地址忽略；
后续可扩展。
返回地址00时，表示无该项值。
src_addr	int	0x0001~0xFFFF	节能灯的Mesh地址
举例:
查询分区地址、车道分组地址和相邻组地址的返回结果：
{
  "src_addr": 13,
  "opcode": 31,
  "value": "00E002F002000000000000"
}
查询网关回复结果（未设置过上报网关）：
{
  "src_addr": 3,
  "opcode": 31,
  "value": "03FFFF0016FFFFFFFFFFFF"
}

3.2.12.切换节能灯使用场景指令
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x20	节能灯切换使用场景的设置
mesh_dev_type	int	0	mesh设备类型
value	int	0~20、
254、255	场景编号，一个字节，
0~20：场景的编号，0表示默认场景；
254：切换到内置的消防场景，开100%亮度；
255：当前为消防场景时，则切回之前运行场景，否则不进行任何操作；
传入其他值或者如果设备本地没找到传入编号的场景，则不进行切换。
注意：场景定义涉及控制项（如亮度修改、感应/工程运行状态修改等），可能被其他接口的操作过，调用本切换使用场景的接口，将让灯具重新运行于场景定义的参数下。
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.13.查询节能灯当前运行场景模式
3.2.13.1.查询节能灯当前运行场景模式
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x21	查询节能灯当前运行场景模式
mesh_dev_type	int	0	mesh设备类型
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.13.2.回复节能灯当前运行场景模式信息
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x22	回复节能灯Mesh组网信息
mesh_dev_type	int	0	mesh设备类型
value	string		节能灯当前运行的场景模式控制参数，n字节（hex转string形式），以下各项的含义请参考文章章节有关各项的接口说明：
byte1：场景编号，范围0~20；
byte2：有人亮度；
byte3：无人亮度；
byte4：无人时关灯延时时长，单位秒；
byte5：运行状态；
byte6：节能灯开关状态，工程模式下有效；
byte7：后面忽略
后续可扩展
注意：如调用其他接口调整参数，可能导致上报的当前运行参数和平台定义场景模式的内容不同；
src_addr	int	0x0001~0xFFFF	节能灯的Mesh地址
举例：查询回复结果：
{
  "src_addr": 13,
  "opcode": 34,
  "value": "005000050301FF0000000000"
}

3.2.14.修改/增加节能灯场景模式定义指令
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x23	节能灯修改/增加的场景模式定义，已存在该编号场景，则修改，否则增加
mesh_dev_type	int	0	mesh设备类型
value	string		要定义的场景模式内容，12字节（hex转string形式），以下各项的有效范围请参考文章章节有关各项的设置接口说明：
byte1：场景编号，范围1~20，0为出厂默认场景，不允许修改和删除；
byte2：有人亮度；
byte3：无人亮度；
byte4：无人时关灯延时时长，单位秒；
byte5：运行状态；
byte6：节能灯开关状态；
byte7~ byte12：预留，填充00
后续可扩展
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址
举例，增加序号0x0A的场景：
{
  "opcode" : 35,
  "value" : "0A64000A0201000000000000",
  "dest_addr" : 11
}
3.2.15.删除节能灯场景控制定义指令
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x24	节能灯修改/增加的场景控制定义，已存在该编号场景，则修改，否则增加
mesh_dev_type	int	0	mesh设备类型
value	int	1~20	一个字节，要删除定义的场景编号（0为出厂默认场景，不允许修改和删除），如删除当前使用的场景模式，则节能灯自动切换到默认场景模式。
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.16.查询节能灯已定义的场景模式
3.2.16.1.查询节能灯已定义的场景模式
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x25	查询节能灯已定义的场景模式的信息
mesh_dev_type	int	0	mesh设备类型
value	int	0~20或者255	要查询的内容，一个字节
0~20：查询指定编号的已定义的场景模式
255：查询已定义的全部场景模式的编号
后续可扩展
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址
举例，查询全部已定义场景模式列表：
{
"opcode":37,
"value":255,
"dest_addr":11
}
3.2.16.2.回复节能灯已定义的场景模式
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x26	回复已定义的场景模式
mesh_dev_type	int	0	mesh设备类型
value	string		要查询的内容和详细信息，n字节（hex转string形式），第一个字节为要查询的内容，后面的字节为详细信息。 
byte1为0~20时：回复指定编号的已定义场景模式内容，格式与查询当前运行场景模式接口相同，如未找到该编号的定义场景模式，则除了第一个表示编号的字节外，其他部分用FF补位；
byte1大于21时：byte2~byte22每个字节表示一个已定义的场景模式的编号，忽略用FF补位的值；
src_addr	int	0x0001~0xFFFF	节能灯的Mesh地址
举例：有0x0A编号的场景定义时的回复：
{
  "src_addr": 11,
  "opcode": 38,
  "value": "0A64000A0201000000000000FFFFFFFFFFFFFFFFFF"
}
没有0x0A编号的场景定义时的回复：
{
  "src_addr": 13,
  "opcode": 38,
  "value": "0AFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF"
}

3.2.17.设置组内联动开关状态
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x27	节能灯组内联动使能开关设置（是否通知同组开灯）
mesh_dev_type	int	0	mesh设备类型
value	int	0或者1	0：感应到有人信号时，不通知同组开灯
1：感应到有人信号时，通知同组开灯
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.18.设置能耗上报周期
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x0F	节能灯的能耗上报周期设置
mesh_dev_type	int	0	mesh设备类型
value	int	0~120	0：不自动上报能耗
1~120：能耗上报周期，单位小时
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址



3.2.19.查询节能灯能耗信息
3.2.19.1.查询节能灯能耗信息指令
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x28	查询节能灯能耗信息
mesh_dev_type	int	0	mesh设备类型
value	int	0或1	0：不重置能耗、亮灯时长；
1：重置能耗、亮灯时长
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址
举例，非重置方式查询：
{
  "opcode" : 40,
  "value" : 0,
  "dest_addr" : 11
}

3.2.19.2.回复或上报节能灯能耗信息
能耗信息上报时，设备将优先往指定的网关地址上报，如果未指定，则设备自主选择路径更短的网关上报。
能耗信息回复时，只回复查询发起方地址。
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x29	回复或上报节能灯能耗信息
mesh_dev_type	int	0	mesh设备类型
running_duration	int32		通电时长，秒
light_on_duration	int32		亮灯时长，秒，包含闪烁的时长在内
power	int		最大功率，瓦
energy_consumption	int32		实际能耗，单位为瓦时，根据亮度和维持时长计算累计所得。
duration_begin	int32		亮灯时长和能耗统计的开始时间点（通电为起始点），秒
value	int		回复时，为查询命令的入参，
自动上报时，该值为0：
0：不重置能耗、亮灯时长；
1：重置能耗、亮灯时长；

src_addr	int	0x0001~0xFFFF	节能灯的Mesh地址

3.2.20.设置联动组联动开关状态
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x30	节能灯联动组联动使能开关（联动点亮该组）
mesh_dev_type	int	0	mesh设备类型
value	int	0或者1	0：感应到有人信号时，不通知联动组组开灯
1：感应到有人信号时，通知联动组组开灯
group_addr	int16		联动组地址
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.21.查询联动组联动开关状态
3.2.21.1.查询节能灯联动组联动开关状态指令
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x31	查询联动组联动开关状态
mesh_dev_type	int	0	mesh设备类型
group_addr	int16		要查询的联动组地址
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址

3.2.21.2.回复联动组联动开关状态
命令方向：
网关 ——> 平台，主题为/application/GW-BM-TCP/device/xxxxxxxxx/up
JSON数据格式：
名称	类型	值	说明
opcode	int	0x32	回复联动组联动开关状态
mesh_dev_type	int	0	mesh设备类型
group_addr	int16		要查询的联动组地址
value	int	0或1	开关状态，0不联动，1联动
src_addr	int	0x0001~0xFFFF	节能灯的Mesh地址

3.2.22.设置智能联动模式参数
命令方向：
平台 ——> 网关，主题为配置的下行消息主题
JSON数据格式：
名称	类型	值	说明
opcode	int	0x34	设置智能联动模式参数
mesh_dev_type	int	0	mesh设备类型
value	int	0~10	0：设置为组联动模式
1~10：设置为智能联动模式，同时该值为各方向车道灯的联动数量
dest_addr	int	0x0001~0xFFFF	要操作的节能灯的Mesh地址，可以为单播地址和组播地址



4.设备出厂默认参数
4.1.节能灯Turbo ESL-BM-T81200(S)
参数名称	类型	出厂默认值	说明
蓝牙配网状态	bool	已配网	已加入默认Mesh网络，默认配置信息：
区地址：0xE000
车道组地址：0xF000
设备mesh地址：0x0001~0x6FFF
场景模式	int	0	默认场景模式：
运行模式：感应模式
关灯延时：5秒自动关灯
有人亮度：100
无人亮度：0
遥控组网使能	int	1	默认支持遥控使能组网
心跳上报周期	int	180	默认180秒
联动模式	int	5	默认智能联动模式，联动范围为各方向5盏车道灯
组内联动开关	int	1	默认联动，需在分组联动方式下有效
相邻组跨组联动开关	Int	1	默认联动，需在分组联动方式下有效
能耗上报周期	int	12	默认每12小时上报一次能耗数据

4.2.蓝牙Mesh网关 Turbo GW-BM-TCP-1
参数名称	类型	出厂默认值	说明
dhcp	bool	true	默认使用dhcp获取地址
设备ip地址	string	192.168.0.100	非dhcp下生效
设备地址掩码	string	255.255.255.0	
设备地址网关	string	192.168.0.1	
Mqtt服务器地址	string	192.168.0.200	
Mqtt服务端口	int	1883	
Mqtt客户端id	string	设备id	
Mqtt订阅Topic	string	/application/GW-BM-TCP/device/xxxxxxxxx/down，
其中xxxxxxxxx为设备的ID号	电信版本默认值为 device_control
管理密码	string	123456	默认支持遥控使能组网

*/

export type Message = {
  opcode: number;
  mesh_dev_type?: number;
  value?: string | number;
  version?: number;
  dest_addr?: number;
  src_addr?: number;
  ota_data_index?: number;
  ota_pack_count?: number;
  ota_byte_size?: number;
  ota_total_size?: number;
  ipaddr?: string;
  netmask?: string;
  gateway?: string;
  mqtt_addr?: string;
  mqtt_port?: number;
  mqtt_username?: string;
  mqtt_password?: string;
  mqtt_subscribe_topic?: string;
  running_duration?: number;
  light_on_duration?: number;
  power?: number;
  energy_consumption?: number;
  dev_model?: string;
  value_array?: any[];
  array_total_size?: number;
  index_from?: number;
  index_to?: number;
  group_addr?: number;
  duration_begin?: number;
};

export enum OpType {
  GW_OTA_START = 0x040,
  GW_OTA_START_ACK = 0x041,
  GW_OTA_DATA = 0x042,
  BLE_OTA_START = 0x43,
  BLE_OTA_START_ACK = 0x044,
  BLE_OTA_DATA = 0x045,

  GW_INFO_REQ = 0x46,
  GW_INFO_ACK = 0x47,

  GW_NET_CONFIG_REQ = 0x48,
  GW_NET_CONFIG_ACK = 0x49,

  GW_MQTT_CONFIG_REQ = 0x4a,
  GW_MQTT_CONFIG_ACK = 0x4b,

  GW_REBOOT_REQ = 0x4c,
  GW_REBOOT_ACK = 0x4d,

  GW_MESH_REQ = 0x4e,
  GW_MESH_ACK = 0x4f,

  BLE_LIST_REQ = 0x50,
  BLE_LIST_ACK = 0x51,

  GW_DNS_CONFIG_REQ = 0x52,
  GW_DNS_CONFIG_ACK = 0x53,

  // Light

  LIGHT_SET_BRIGHTNESS = 0x01,
  //LIGHT_SET_BRIGHTNESS_ACK = 0x02,

  LIGHT_SET_ONOFF = 0x05,
  //LIGHT_SET_ONOFF_ACK = 0x06,




  LIGHT_OTA_START = 0x11,
  LIGHT_OTA_START_ACK = 0x12,

  LIGHT_INFO_REQ = 0x1c,
  LIGHT_INFO_ACK = 0x1d,

  LIGHT_SET_OFF_DELAY = 0x15,
  //LIGHT_SET_OFF_DELAY_ACK = 0x16,

  LIGHT_SET_MODE = 0x17,
  //LIGHT_SET_MODE_ACK = 0x18,

  LIGHT_SET_JOIN_ENABLE = 0x19,
  //LIGHT_JOIN_ENABLE_ACK = 0x1A,

  LIGHT_SET_HEATBEAT_INTERVAL = 0x1a,

  LIGHT_HEATBEAT_DATA = 0x1b,

  LIGHT_GROUP_REQ = 0x1e,
  LIGHT_GROUP_ACK = 0x1f,

  LIGHT_SCENE_SET = 0x20,

  LIGHT_SCENE_GET = 0x21,
  LIGHT_SCENE_ACK = 0x22,

  LIGHT_SCENE_MODIFY = 0x23,
  LIGHT_SCENE_DEL = 0x24,

  LIGHT_SCENE_QUERY = 0x25,
  LIGHT_SCENE_QUERY_ACK = 0x26,

  LIGHT_LINKAGE_STATE_SET = 0x27,



  LIGHT_ENERGY_INTERVAL = 0x0f,
  LIGHT_ENERGY_GET = 0x28,
  LIGHT_ENERGY_ACK = 0x29,

  LIGHT_LINKAGE_GROUP_STATE_SET = 0x30,
  LIGHT_LINKAGE_GROUP_STATE_GET = 0x31,
  LIGHT_LINKAGE_GROUP_STATE_ACK = 0x32,

  LIGHT_GROUP_SET = 0x33,

  LIGHT_LINKAGE_MODE_SET = 0x34,

}
