---
title: V2Ray Ndoe Deployment
date: 2026-9-16
tags: ["AWS", "V2Ray", "NODE"]
description: 用一个简单的工作流自动生成文章索引并部署网站。
---

# 🚀 AWS EC2 Hands-on Deployment Tutorial: Building an Exclusive V2Ray Node (Ubuntu Edition)

## Preface

 Recently, I've been tossing around cloud servers, and decided to document the complete process of deploying a V2Ray node on AWS EC2 from scratch. For those of you who are new to AWS, Linux, and V2Ray, the really hard part is not so much the commands, but the fact that you don't know what each step has to do with each other the first time you do it: why do you need to configure a security group after you create an EC2? Why does SSH connect to the server, but the V2Ray client doesn't? Why does the client show that it is using port  `7890`  when AWS should not have  `7890` open? Why does V2Ray show up as running, but the outside world can't connect? These issues may seem fragmented, but in reality they all have to do with the relationship between cloud servers, network ports, firewalls, and application listening. 

So this article is not just a simple list of commands, but follows the actual deployment sequence, from AWS account, EC2 instance creation, Ubuntu system preparation, SSH remote connection, security group configuration, all the way to V2Ray installation, UUID generation, configuration file modification, service startup, client configuration and troubleshooting complete explanation. You can use this article as a tutorial to start from scratch, or use the corresponding chapters as a reference for troubleshooting when you encounter problems during the deployment process. 

This article uses Ubuntu Server LTS and AWS EC2 as the base environment for illustration.The specific interface of AWS console, instance type, free package policy, and the interface of V2Ray client may change over time, so if the interface you see is slightly different from this article, don't worry about it, as long as you can find the corresponding function. Note that AWS instances, storage, public IPs, data transfers, and other resources may involve fees, so it is recommended that you check the free packages and billing rules that apply to your current account before creating a server. The content of this article is mainly used for Linux cloud servers, network service deployment and related technical learning, please use in compliance with local laws and regulations as well as the premise of AWS Terms of Service. 

---

## I. Preparation: What do you need? 

Before you start, you need to prepare a working AWS account, a computer with an Internet connection, and a secure location to save your AWS SSH private key. windows users can use PowerShell or Windows Terminal, macOS and Linux users can just use the terminal that comes with their system. For the server, we use AWS EC2 to create an Ubuntu Server cloud server; for the client, you can choose a client that supports the corresponding protocols according to your own equipment and actual needs.

The entire deployment process can be simply understood as the following link:

```text
Your computer
   │
   │ SSH / Client Connection
   ▼
AWS EC2
   │
   ▼
Ubuntu Server
   │
   ▼
V2Ray
   │
   ▼
Internet
```

Where AWS EC2 is responsible for providing the server environment, Ubuntu is the operating system running on top of EC2, V2Ray is the actual running web service, and AWS Security Group and Ubuntu Firewall are responsible for controlling whether or not the external network can access the specified ports on the server. 

Before we begin, there is one more concept that needs to be understood in particular:** Client-side local proxy ports and server-side service ports are two different things. **For example, some clients may use a  `127.0.0.1:7890`  locally on your computer as a proxy entry; just because this  `7890`  belongs to your own computer does not mean that the AWS server needs to listen on or open the  `7890`. If V2Ray on the server is actually listening for  `10086`, then it is the  `10086` that the server needs to deal with, not the client's local  `7890`. 

---

## To create an AWS EC2 instance

Log in to the AWS Management Console, type  `EC2` in the search box at the top, go to the EC2 service page, and then find "Launch instance". When creating an instance, you can first set the instance name, such as  `My-V2Ray-Server`, `My-VPS` , or  `Ubuntu-Server`. This name is to make it easier for you to identify the server, and will not affect the subsequent operation of V2Ray. 

Next, you select the operating system image, or AMI. In this article, we'll use Ubuntu Server as an example, and we recommend prioritizing the stable LTS version that is currently available on the AWS console, which is called Long Term Support, and is often more appropriate for server environments. If you see Ubuntu 22.04 LTS, Ubuntu 24.04 LTS, etc., you can choose based on current software compatibility and your actual needs. Don't assume that just because an old tutorial is written about a specific version, it has to be exactly the same. 

For instance types, if you're just doing Linux learning, V2Ray testing, or running some very lightweight services, you can go with one of the small-spec instances that AWS currently offers. However, it's important to note that AWS instance types and free package policies change, and the  `t2.micro`  that often appears in some tutorials doesn't necessarily mean it's free at any time, in any region, and under any account. Creating an instance should be based on the eligibility and pricing displayed in your own AWS console. 

Next you need to create the SSH Key Pair. find the Key pair option and click Create new key pair, for example name it `MyEC2Key`Then select the appropriate key format and download it. For Linux/macOS/Windows OpenSSH environments, the common formats are `.pem`. Make sure to save it properly after downloading, for example, you can put it in a special AWS key directory on your computer. This file is very important as it will be needed later for SSH login to the server. Do not store the `.pem` Upload the file to GitHub, a public web drive, a forum, or any other public location, much less commit it to a code repository.

Once you've completed the key configuration, it's time for the network setup. Here you need to focus on the Security Group, which is the AWS security group. A security group can be thought of as a layer of network firewall outside of the EC2 instance that determines which sources can access which ports on the server. ssh uses TCP 22 by default, so your computer must be allowed to access the server via TCP 22. If V2Ray listens on TCP 10086, you will also need to allow external access to TCP 10086 depending on the actual usage scenario.

If you're just using SSH to manage the server yourself, it's a good idea not to set the SSH source to the whole world for a long time. For example, you can limit the source of TCP 22 to your current public IP and use the `/32` Indicates a single IP. and can be adjusted to suit if your public IP changes frequently. but it is not recommended to permanently open all sources just for convenience.

Special care needs to be taken not to open a large number of unneeded ports all together. For example, if a server only needs SSH and V2Ray, it is usually not necessary to have both ports open. `8080`、`8888`、`7890`、`12345` The principle of the server should be "open what you need", not "open all the ports first, then we'll see what happens later". The principle of the server should be "open what you need", not "open them all later".

Finally, check the instance name, Ubuntu image, instance type, key pairs, network settings and storage configuration, and then click "Launch instance". Wait for the instance status to change to `Running`, then go to the instance details page and find the `Public IPv4 address`This address is the public IPv4 address that may be used later for SSH login to the server and for client connections.

---

## Connecting to Ubuntu via SSH

EC2 creation complete and enter `Running` After the status, you can log in to the server using SSH, which is the most common way of remotely administering Linux servers; you actually open a terminal on your own computer and connect to the Ubuntu system in AWS over the Internet.

If you are using Windows, you can open PowerShell or Windows Terminal. assume your key file is named `MyEC2Key.pem`The server's public IP is `203.0.113.10`, then the command can be written as:

```bash
ssh -i "MyEC2Key.pem" ubuntu@203.0.113.10
```

If the key file is located on the Windows desktop, you can use a similar:

```powershell
ssh -i "C:\Users\Administrator\Desktop\MyEC2Key.pem" ubuntu@203.0.113.10
```

macOS or Linux users can go to the directory where the key is located and then execute the `chmod 400 MyEC2Key.pem` Restrict private key permissions and execute again:

```bash
ssh -i "MyEC2Key.pem" ubuntu@203.0.113.10
```

Here. `ubuntu` This is important because the official Ubuntu EC2 image normally uses the `ubuntu` as the default SSH user. In other words, when connecting for the first time, don't follow some common VPS tutorials that say `root@服务器IP`. If you are using the Ubuntu EC2 image, you should normally use the `ubuntu@服务器IP`and then when administrator privileges are needed, pass the `sudo` Execute the command.

The first time an SSH connection is made, the terminal may display something like `The authenticity of host ... can't be established` This is SSH asking if you trust the server. If you are sure that this is the EC2 instance you just created, you can enter the `yes` Continue. After successfully logging in, you'll usually see something like `ubuntu@ip-xxx-xxx-xxx-xxx:~$` You will see a command prompt for the Ubuntu server on AWS instead of continuing to operate your computer. Once you see this prompt, you are now on the Ubuntu server on AWS, rather than on your own computer.

If the SSH connection fails, there are three places we recommend checking first. First, make sure that the EC2 instance is still in the `Running` status and confirm that the public IP of the current instance is used; second, check whether the Security Group allows TCP port 22; third, confirm that the `.pem` file path and key are correct. If prompted `Permission denied (publickey)`The main focus should usually be on checking the username, the key, and the Key Pair that was used when the instance was created.

---

## Update your Ubuntu system and prepare your environment.

After successfully logging into Ubuntu, it is recommended to update the package list and upgrade your system. The most commonly used commands are `sudo apt update`which is responsible for updating the package index; later use the `sudo apt upgrade -y` Install available software updates. Therefore it can be executed directly:

```bash
sudo apt update && sudo apt upgrade -y
```

Once the system update is complete, you can check the current Ubuntu version by running the `lsb_release -a`; see the Linux kernel can be accessed using the `uname -a`To view the memory usage you can use the `free -h`To view the disk space you can use the `df -h`. These commands are not mandatory for V2Ray, but are well worth familiarizing yourself with if you are going to be using a Linux cloud server for a long time. 

 If you are prompted to restart certain services or if a restart is recommended after a kernel update, you can follow the prompts. If you do need to reboot the server, you can run  `sudo reboot` and then wait a few minutes before reconnecting via SSH. Note that if your EC2 is not configured with a fixed public IP, the public IP may change when the instance is stopped and restarted, so it's a good idea to go back to the AWS console to confirm the current public IPv4 address before reconnecting.

---

## V. Installing V2Ray

After you've finished preparing your Ubuntu base environment, you can install V2Ray. V2Ray itself is a server-side network service, so it needs to be further configured to work properly after installation. Before installing V2Ray, you can make sure that your system has a  `curl`, if not, you can run  `sudo apt install curl -y`. 

The V2Fly project provides a common way to install scripts, which can be used: 

```bash
bash <(curl -L https://raw.githubusercontent.com/v2fly/fhs-install-v2ray/master/install-release .sh)
```

Execute it and wait for the installer to finish. After the installation is finished, you can try to execute  `v2ray version`  to see the version information. If the system outputs the version number normally, it usually means that the program has been installed successfully. 

V2Ray can usually be managed as a systemd service in Ubuntu. systemd is a very important service management mechanism in Linux, so in the future you don't need to run the V2Ray program manually every time, but you can control it via  `systemctl` . For example, you can start a service with  `sudo systemctl start v2ray`, stop a service with  `sudo systemctl stop v2ray`, restart a service with  `sudo systemctl restart v2ray`, and check the status of a service with  `sudo systemctl status v2ray`. 

If you want V2Ray to start automatically after a server reboot, you can run  `sudo systemctl enable v2ray`. You can also use  `sudo systemctl enable --now v2ray`, which will simultaneously set up boot start and start the service immediately. 

It is important to note that **successful installation is not the same as successful configuration**. Just installing V2Ray does not mean that it is listening on the specified ports as you want. Next, you need to generate UUIDs, modify configuration files, and check whether the service can start normally. 

---

## VI. Generating a UUID

V2Ray configuration usually requires a UUID as the client credentials. Linux can generate a UUID by itself, there is no need to install additional tools. Execute:

```bash
cat /proc/sys/kernel/random/uuid
```

The terminal will output a string similar to the following:

```text
xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxxxx
```

The actual generated content will be different from the example you see. Please copy the UUID generated by your own server and save it. When you configure the client later, you need to fill in the exact same UUID.

Although the UUID is not like the SSH private key that can directly log in to the server, it is client-side authentication information, so it is also not recommended to publish the "server IP + port + UUID" together. If you suspect that the UUID has been leaked, you can regenerate a new UUID and change both the server configuration and client configuration.

---

## VII. Configuring V2Ray

Once the installation is complete, you will need to edit the V2Ray configuration file. In a common installation, the configuration file is located in the `/usr/local/etc/v2ray/config.json`The Nano editor can be used for editing:

```bash
sudo nano /usr/local/etc/v2ray/config.json
```

Nano is a very common terminal text editor in Ubuntu. Once inside, you can use the arrow keys to move the cursor.`Ctrl + K` Delete the current line.`Ctrl + O` Save the file, then press Enter to confirm, and finally use the `Ctrl + X` Exit.

This article starts with a more basic VMess + WebSocket configuration as a lab example. Place the following `你的UUID` Replace it with the actual UUID you just generated:

````json
{
  "inbounds": [
    {
      "listen": "0.0.0.0",
      "port": 10086,
      "protocol": "vmess",
      "settings": {
        "customers": [
          {
            "id": "Your UUID".
            "alterId": 0
          }
        ]
      },
      "streamSettings": {
        "network": "ws",
        "wsSettings": {
          "path": "/your-path"
        }
      }
    }
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "tag": "direct"
    }
  ]
}
````

The most important parameters in this configuration are `port`、`protocol`、`id`、`network` 和 `path`。`port` Determines which port the V2Ray service listens on, in this case using the `10086`；`protocol` Indicates the use of VMess;`id` is the UUID;`network` set to `ws`, which indicates the use of a WebSocket;`path` is the path to the WebSocket.

For example, the server configuration uses `/your-path`The client must also use the `/your-path`. If the server uses the `/your-path`The client fills in the `/v2ray`If the IP, port, and UUID are all correct, then you will not be able to connect properly according to this configuration.

It is also important to note the syntax of JSON, which is very strict about parentheses, quotes, and commas. For example, the following configuration is incorrect:

````json
{
  "port": 10086,
  "protocol": "vmess",
}
````

Because there is an extra comma after the last field. The correct way to write it should be:

````json
{
  "port": 10086,
  "protocol": "vmess
}
````

Therefore, after modifying the configuration file, it is not recommended to assume directly that the configuration must be correct, but to check it first.

---

## Check the configuration and start V2Ray.

If the server has installed the `jq`It can be used to check the JSON format. If you don't have it installed, you can run `sudo apt install jq -y`, and then run:

```bash
sudo jq . /usr/local/etc/v2ray/config.json
```

If the JSON format is correct, the`jq` will reformat the configuration and output it; if there is a syntax problem, it will indicate the specific error location.

It is also possible to test the configuration based on the commands supported by the current V2Ray version. For example certain versions can be used:

```bash
v2ray test -config /usr/local/etc/v2ray/config.json
```

If your version of the command is formatted differently, it is possible to pass the `v2ray help` View the commands supported by the current version.

After confirming that there are no obvious errors in the configuration, restart V2Ray:

```bash
sudo systemctl restart v2ray
```

Then check:

```bash
sudo systemctl status v2ray
```

If you see something similar:

```text
Active: active (running)
```

Indicates that the V2Ray service is running.

If the display `failed`Instead of continuing to execute restart over and over again, you should check the logs. The most commonly used command is:

```bash
sudo journalctl -u v2ray --no-pager -n 100
```

If you wish to observe the logs in real time, you can use:

```bash
sudo journalctl -u v2ray -f
```

Then do the client connection test, so you can observe whether the server side receives the connection and what errors occur. 

---

## 9. Check if port 10086 is actually listening

V2Ray service display `active (running)` doesn't necessarily mean that the port is listening correctly, so you also need to confirm it from the Linux system level. 

Execute:

```bash
sudo ss -lntp | grep 10086
```

If you can see something like:

```text
LISTEN 0 4096 0.0.0.0:10086 0.0.0.0:*
```

It means that the system is listening to TCP 10086.

If you don't see any output, it means that no program is currently listening on this port. At this point, you should recheck the V2Ray service state and configuration files rather than continue to modify the AWS Security Group.

This is important because network connections actually go through multiple layers:

```text
Client
   ↓
Internet
   ↓
AWS Security Group
   ↓
EC2 Ubuntu
   ↓
Ubuntu Firewall
   ↓
10086 Port
   ↓
V2Ray
```

A problem at any of these layers can cause the client connection to fail. 

---

## X. Configuring the AWS Security Group

Now that the server side has been configured and you've confirmed that V2Ray is listening `10086`, the next step is to make sure that AWS allows external connections to this port. 

Go to the AWS EC2 console, find the corresponding instance, and then go to Security Group. in  `Inbound rules` Make sure that the TCP port 22 for SSH and the TCP port 10086 used by V2Ray meet your actual needs. 

For example:

```text
Type: SSH
Protocol: TCP
Port: 22
Source: Your management IP
```

and:

```text
Type: Custom TCP
Protocol: TCP
Port: 10086
. Source: Set according to your actual access needs
```

If the V2Ray service needs to be accessed from the public network, then the corresponding service port needs to allow the corresponding public network source; if it is only used in a specific network environment, then the source can be further restricted. 

It needs to be emphasized again, **Don't open 7890 in AWS just because the client software uses 7890.** Assuming that V2rayN uses  `127.0.0.1:7890`  as the local proxy port on your Windows computer, it means:

```text
Your computer 
   │
   └── 127.0.0.1:7890
```

Here. `127.0.0.1` denotes the current computer itself, and 7890 is the client's local listening port. It has no direct port correspondence with the V2Ray service on AWS EC2.

If the V2Ray configuration on EC2 is `10086`If the AWS Security Group is concerned with TCP 10086, then the AWS Security Group should be concerned with TCP 7890, not TCP 10086, so many of the original tutorials had both open `10086` 和 `7890` is not necessary, and in particular do not expose 7890 to the entire Internet for the sake of the client's local port.

---

## XI. Ubuntu UFW Firewall

In addition to the AWS Security Group, Ubuntu itself can configure a firewall. A common tool is UFW, which can be configured using the `sudo ufw status` View the current status.

If you are going to enable UFW, you must allow SSH first, otherwise it is very easy to have the situation of "I can't log in to the server after turning on the firewall". You can do it first:

```bash
sudo ufw allow 22/tcp
sudo ufw allow 10086/tcp
```

Then enable it again:

```bash
sudo ufw enable
```

Last check:

```bash
sudo ufw status
```

If it shows that the corresponding port has been allowed, it means that the UFW is working according to the current configuration.

It is important to understand that AWS Security Group and UFW are two different layers of firewalls:

```text
Internet
    ↓
AWS Security Group
    ↓
EC2
    ↓
Ubuntu UFW
    ↓
V2Ray
```

So even if AWS Security Group has released 10086, the connection may still fail if Ubuntu UFW blocks it, and vice versa. If AWS doesn't release it, even if Ubuntu UFW allows it, you can't access it properly from the public network.

---

## Configuring the V2rayN Client

Once the server side is complete, you can configure the corresponding server on the Windows client side. The menu name may change in different versions of V2rayN, but the core parameters are basically the same. When adding a server, you need to fill in the server's public IP, port, UUID, transmission method and WebSocket Path.

Assume that the server information is as follows:

```text
Address:
Your AWS public IPv4

Port:
10086

Protocol:
VMess

UUID:
Server-generated UUID

Network:
WebSocket / ws

Path:
/your-path
```

where Address fills in the current public IPv4 address of the AWS EC2, and Port must be the same as in the server configuration `10086` The UUID must be identical to the UUID in the server's configuration file, Network should be WebSocket and Path should be `/your-path`。

The client-server relationship can be simply understood as:

```text
Server:

Port = 10086
UUID = A
Network = ws
Path = /your-path


Client:

Port = 10086
UUID = A
Network = ws
Path = /your-path
```

That is, the parameters such as Address, Port, UUID, Transmission Method and Path, which are involved in the connection itself, must correspond correctly.

---

## XIII. Why can't I connect? Follow this sequence

Don't reinstall V2Ray right off the bat if the client can't connect. the most effective way to troubleshoot a problem with a network service is to troubleshoot it layer by layer, from the outside in.

First go to the AWS console to confirm that the EC2 instance is still `Running`If the instance has been stopped and restarted without a fixed public IP, then the client will simply fail to connect if it continues to use the old IP. If the instance has been stopped and restarted without a fixed public IP configured, the public IP may have changed, and clients continuing to use the old IP will simply fail to connect.

Then check the AWS Security Group to confirm that TCP 10086 allows access. If UFW is used, then run `sudo ufw status`If the port is not blocked by Ubuntu's local firewall, make sure that the port is not blocked by Ubuntu's local firewall.

Next, log in to the server and execute `sudo systemctl status v2ray`that confirms the status of the service. If the service is not running, execute `sudo journalctl -u v2ray --no-pager -n 100` View Log.

then execute `sudo ss -lntp | grep 10086`If the 10086 is not listening, then the problem usually occurs during the V2Ray configuration or service startup phase. If it's not listening, the problem usually occurs during the V2Ray configuration or service startup phase; if it's already listening, then continue to check the AWS network layer and client configuration.

Finally, check the client parameters, including the server's public IP, port, UUID, WebSocket, and Path, especially the UUID and Path, which are most likely to fail due to replication errors.

You can troubleshoot in this order below:

```text
Is EC2 Running
        ↓
Is the public IP correct?
        ↓
Does AWS Security Group allow
        ↓
Whether Ubuntu UFW is allowed or not 
        ↓
Whether V2Ray is running or not 
        ↓
Whether 10086 is listening or not 
        ↓
Whether UUID is consistent or not 
        ↓
Whether WebSocket is consistent or not 
        ↓
Whether Path is consistent or not 
        ↓
Testing again on the client side
 ```

This way of troubleshooting is usually more effective than constantly modifying the configuration. 

---

## XIV. Common Error Analysis

If  `Connection refused` appears on the client side, it usually means that the target server is reachable, but the corresponding port is not accepting connections normally. At this point, you can focus on checking whether V2Ray is started, and whether  `10086`  is listening. If there is a  `Connection timeout`, it is more important to check the public IP, AWS Security Group, Ubuntu Firewall, and network access path. 

If V2Ray is running correctly on the server side, but the client is prompting authentication-related errors, you should focus on checking the UUID; the client's UUID must exactly match the  `id`  in the server configuration file. 

If you are using WebSocket, the Path of the client and server must also be the same. For example, if the server uses  `/your-path` but the client fills in  `/v2ray`, there will be connection problems. 

If the V2Ray service fails to start, it is a priority to look at:

 ``bash
sudo journalctl -u v2ray --no-pager -n 100
 ``

If the logs show JSON, configuration fields, or port-related errors, go back to the  `/usr/local/etc/v2ray/config.json`  check. Don't change a dozen parameters at once; it's best to tweak one place at a time, then recheck the configuration, restart the service, and watch the logs. 

---

## XV.Security Recommendations

If you are just learning and experimenting temporarily, the basic configuration above can help you understand the relationship between EC2, Ubuntu, V2Ray, ports, and clients. But if you are going to run the server for a long time, you should consider security further. 

First of all, don't give out your SSH private key. `.pem` The file, once obtained by someone else, can cause serious server security problems. Second, do not make authentication information such as UUID and server address freely available. Again, SSH ports should be restricted to as many sources as possible, and ports should not be opened that have no practical use. 

System-wise, you should perform regular  `sudo apt update && sudo apt upgrade -y` updates</> of Ubuntu packages, and check the V2Ray service status, disk space, and system logs regularly. After the server has been running for a long time, you also need to keep an eye on AWS billing and resource usage to avoid incurring additional charges for forgetting to release resources such as test instances, disks, or public IPs.

If the server is ready to run for a long time, you can also use further components such as domain names, TLS, Nginx or Caddy to build a more complete web service architecture. However, this is already advanced content, and it is not recommended to add all components at once when deploying for the first time, otherwise it will be difficult to determine which layer is failing after a problem occurs.

---

## Domain Names, TLS, and Reverse Proxies: Advanced Directions

Infrastructure can often be understood as:

```text
client (computing)
   ↓
Public IP
   ↓
EC2
   ↓
V2Ray
```

If you continue to upgrade, you can become:

```text
client (computing)
   ↓
domain name
   ↓
DNS
   ↓
EC2
   ↓
Nginx / Caddy
   ↓
TLS / HTTPS
   ↓
WebSocket
   ↓
V2Ray
```

This architecture involves a lot more knowledge, including DNS resolution, domain management, TLS certificates, HTTPS, reverse proxying, and Web Server configuration. It's not just about V2Ray, it's also a very common technology stack for website and API service deployments.

For example, if you want to deploy personal blogs, APIs, web services, and other applications on the same EC2, you can learn more about Nginx, Caddy, Docker, Cloudflare DNS, and other technologies. Then you'll no longer just have "how to install a V2Ray", but a complete set of deployment ideas that can be migrated to personal websites, API services, Docker projects, and other cloud server applications.

---

## XVII. Summary of commonly used Linux and V2Ray commands

When you manage the server in the future, you don't need to re-search for commands every time, the following basic commands can be directly used as a reference for daily maintenance.

Update the system:

```bash
sudo apt update && sudo apt upgrade -y
```

Check out the Ubuntu version:

```bash
lsb_release -a
```

Check the memory:

```bash
free -h
```

View the disk:

```bash
df -h
```

View ports:

```bash
sudo ss -lntp
```

View the V2Ray status:

```bash
sudo systemctl status v2ray
```

Start V2Ray:

```bash
sudo systemctl start v2ray
```

Stop V2Ray:

```bash
sudo systemctl stop v2ray
```

Restart V2Ray:

```bash
sudo systemctl restart v2ray
```

Set up boot: 

```bash
sudo systemctl enable v2ray
```

 View recent logs:

```bash
sudo journalctl -u v2ray --no-pager -n 100
```

View logs in real time:

```bash
sudo journalctl -u v2ray -f
```

View specified port:

```bash
 sudo ss -lntp | grep 10086
```

View UFW:

``bash
sudo ufw status
``

---

## XVIII Complete Deployment Checklist

If you've followed this article to the letter, you can check it one last time by following the following checklist:

### AWS
- [x] AWS account is normal 
- [x] EC2 instance has been created 
- [x] Ubuntu Server is running normally 
- [x] SSH Key has been saved 
- [x] Public IPv4 has been verified 
- [x] Security Group has been configured 

### SSH
- [x] SSH login can be used 
- [x] Using the ubuntu user 
- [x] PEM private key path is correct 

### Ubuntu
- [x] System has been updated 
- [x] curl has been installed 
- [x] UFW is configured correctly (if enabled) 

### V2Ray
- [x] V2Ray has been installed 
- [x] UUID has been generated 
- [x] config.json has been modified 
- [x] JSON format is correct 
- [x] V2Ray service is running normally 
- [x] 10086 is listening 

### Client
- [x] AWS public IP is correct 
- [x] Port = 10086
- [x] UUID matches server 
- [x] Network = WebSocket
- [x] Path = /your-path 

### Network
- [x] AWS Security Group allows service ports
- [x] Ubuntu firewall allows service ports
- [x] SSH works fine

---

## Summary

From creating a server with AWS EC2 to finally getting clients to successfully connect, it's not really a single software installation command that needs to be mastered, but a whole cloud server deployment mindset. First you get a cloud server via AWS EC2, then you use SSH to get into Ubuntu remotely; then you update your system and install V2Ray, then you configure the service by UUID, port, protocol, and transport; then you control network access via AWS Security Group and the Ubuntu firewall, and finally you fill in the parameters on the client side that correspond to the server. 

The whole process can be condensed into:

- AWS EC2
  ↓
- Ubuntu
  ↓
- SSH
  ↓
- V2Ray
  ↓
- config.json
  ↓
- UUID + Port + Protocol + WebSocket
  ↓
- AWS Security Group
  ↓
- Client

The most important thing to understand is the concept of "port". The server-side V2Ray  `10086`  is a server-side listening port, while ports such as  `7890`  used by client-side software are usually local proxy ports, and are not the same thing. Understanding the relationship between server-side ports, client-side ports, AWS Security Groups, and Ubuntu UFW makes many seemingly complex network problems much easier to troubleshoot. 

If you're ready to go deeper, you can build on this foundation by learning about domain names, DNS, TLS, Nginx, Caddy, Docker, Cloudflare, and Linux server security. You'll no longer just have "how to install a V2Ray", but a complete set of deployment ideas that can be migrated to personal websites, API services, Docker projects, and other cloud server applications. 

Finally, it is important to remember that cloud servers and web services should be used in accordance with local laws and regulations, the AWS Terms of Service, and other applicable rules. This article is for learning about AWS EC2, Ubuntu, Linux service management and network configuration.
