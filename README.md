# my-blog
基于Express+Mongodb+Nodejs搭建的多人博客系统

学习nswbmw大神的教程写的博客系统，用到了Express框架搭建网站架构，Mongodb作为数据库。

代码改进：

	1：models/post.js中使用了异步编程类库Async做异步的流程控制，代码看起来思路清晰很多。
	
	2：models/post.js中改进了对数据库的操作动作，用到了generic-pool模块，管理对数据库的连接池，
	这样就不用每次对数据库操作时都创建新的连接，使用完断开，降低了对于数据库的消耗。连接池可以维护一定数量的数据库连接，有连接到来随取随用。
	
	3：models/user.js中对数据库的操作采取了不同的方式，用到了mongoose数据库管理模块，管理对数据库的操作。

