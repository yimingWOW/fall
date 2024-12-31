# fall-on-solana

############################sol net config############################# 
# 在一个新的终端窗口中运行 启动验证器
solana-test-validator

# 停止验证器（Ctrl+C）
# 清理旧的测试数据
solana-test-validator --reset

# 更严格的localnet
solana-test-validator \
  --reset \
  --ledger test-ledger \
  --rpc-port 8899 \
  --faucet-port 9900 \
  --bind-address 0.0.0.0 \
  --limit-ledger-size 10000 \
  --slots-per-epoch 432000 \
  --account-index program-id \
  --account-index spl-token-owner \
  --account-index spl-token-mint \
  --compute-unit-limit 1400000 \
  --log-messages-bytes-limit 10000 \
  --transaction-account-lock-limit 64 \
  --faucet-sol 1000000

# 检查当前网络配置
solana config get

# 切换到本地网络
solana config set --url localhost
solana config set --url https://rpc.ankr.com/solana_devnet
solana config set --url devnet
solana config set --url testnet
solana config set --url https://solana-devnet.g.alchemy.com/v2/LGrsjrey4ih3l9AiWhVzj3FeuozMcFqv
solana config set --url https://solana-devnet.g.alchemy.com/v2/61IsKIeSrqAmU4FFb2vNaEm22I07hVv-
# 确保你有足够的 SOL 用于部署
solana balance

# 如果在 devnet 上需要测试 SOL
solana airdrop 5

############################创建测试代币############################# 
# 查看当前钱包的代币余额
spl-token balance <token_mint_address>

# 发送代币到指定地址
spl-token transfer <token_mint_address> <amount> <recipient_address>

# 如果接收方还没有代币账户，添加 --fund-recipient 参数
spl-token transfer <token_mint_address> <amount> <recipient_address> --fund-recipient

# 发送 10 个 Token A（假设精度是 6） token_mint_address 在 fall/scripts/token-info.json

# 创建测试代币
cd fall/scripts/create-test-tokens.ts
npm run create-test-tokens

# 创建测试代币 命令
# 1. 创建代币铸造账户
solana-keygen new --no-bip39-passphrase -o my-token-mint.json

# 2. 创建代币（使用 spl-token 命令）
spl-token create-token my-token-mint.json

# 3. 创建代币账户
  solana-keygen new --no-bip39-passphrase -o ./recovered-keys/my-token-mint.json
  spl-token create-token ./recovered-keys/my-token-mint.json --decimals 6
    Creating token GvK3UYYQwgXPvQiEpfFnhWN3Ta3b9crFmqSX8o5aMTuu under program TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA
  spl-token mint <TOKEN_MINT_ADDRESS> <AMOUNT> <RECIPIENT_TOKEN_ACCOUNT>
    spl-token mint GvK3UYYQwgXPvQiEpfFnhWN3Ta3b9crFmqSX8o5aMTuu 10000000000

  spl-token balance GvK3UYYQwgXPvQiEpfFnhWN3Ta3b9crFmqSX8o5aMTuu
  spl-token transfer GvK3UYYQwgXPvQiEpfFnhWN3Ta3b9crFmqSX8o5aMTuu 1000000000 GUXNPX5ci1Qj76MZe2aRJ33zK48VmT6gXVyR86CsF4T5 --fund-recipient

# 发送代币
solana transfer GUXNPX5ci1Qj76MZe2aRJ33zK48VmT6gXVyR86CsF4T5 5 --allow-unfunded-recipient
solana transfer 2mXXs3ZLK7UpDDwHmJajcMTT3YRkg4Ymo9osQSUu8CAu 5 --allow-unfunded-recipient

# 已经包含转账给GUXNPX5ci1Qj76MZe2aRJ33zK48VmT6gXVyR86CsF4T5逻辑
npm run create-test-tokens 

<!-- spl-token transfer CRsN2SFth8y3XWwpDEcM8bPXJfSMYcFDUEZTyBGSynW 1000 GUXNPX5ci1Qj76MZe2aRJ33zK48VmT6gXVyR86CsF4T5 --fund-recipient --allow-unfunded-recipient

spl-token transfer 5krHo5igQKqn45zsnU45rzLN7R1pMwk4rmbN7RWV5HGi 1000 GUXNPX5ci1Qj76MZe2aRJ33zK48VmT6gXVyR86CsF4T5 --fund-recipient --allow-unfunded-recipient -->

# 将 SOL 转换为 wsol
spl-token --url devnet wrap 1 

spl-token transfer So11111111111111111111111111111111111111112 0.99796072 GUXNPX5ci1Qj76MZe2aRJ33zK48VmT6gXVyR86CsF4T5 --fund-recipient --allow-unfunded-recipient

devnet 的两个spl token
GvK3UYYQwgXPvQiEpfFnhWN3Ta3b9crFmqSX8o5aMTuu
Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr
##############################构建程序###########################
anchor init --program-name fall --program-version 0.1.0

# 运行测试
anchor test

# 创建新的keypair 获取公钥
solana-keygen new -o target/deploy/amm-keypair.json
solana-keygen pubkey target/deploy/amm-keypair.json
solana-keygen new -o target/deploy/credit-keypair.json
solana-keygen pubkey target/deploy/credit-keypair.json

# 获取新的程序ID $PROGRAM_ID
solana address -k target/deploy/fall-keypair.json

# 清理 构建
anchor clean && anchor build
anchor build

# 部署(一定要开log)
RUST_BACKTRACE=1 RUST_LOG=debug anchor deploy --provider.cluster localnet
RUST_BACKTRACE=1 RUST_LOG=debug anchor deploy --provider.cluster devnet
RUST_BACKTRACE=1 RUST_LOG=debug anchor deploy --provider.cluster mainnet
RUST_BACKTRACE=1 RUST_LOG=debug anchor deploy --provider.cluster https://solana-devnet.g.alchemy.com/v2/LGrsjrey4ih3l9AiWhVzj3FeuozMcFqv
RUST_BACKTRACE=1 RUST_LOG=debug anchor deploy --provider.cluster https://solana-devnet.g.alchemy.com/v2/61IsKIeSrqAmU4FFb2vNaEm22I07hVv-

solana program deploy --program-id target/deploy/fall-keypair.json target/deploy/fall.so --url https://solana-devnet.g.alchemy.com/v2/61IsKIeSrqAmU4FFb2vNaEm22I07hVv-

# 部署失败，记录log中的助记词，释放资金命令
solana-keygen recover -o ./recovered-keys/buffer-keypair.json
solana program close $(solana-keygen pubkey ./recovered-keys/buffer-keypair.json)
  

# 多次部署
  # 生成缓冲区keypair
  solana-keygen new -o ./recovered-keys/buffer-keypair.json --no-bip39-passphrase

  # 得到缓冲区地址
  Buffer: u3Ff5iu7XPLxPF5ie74gkMqNScGj6gBUeeQsqaxUz2y

  # 写入缓冲区 # 使用缓冲区进行部署
  RUST_LOG=debug,solana_client=debug,solana_runtime=debug \
  solana program write-buffer \
    target/deploy/fall.so \
    --buffer ./recovered-keys/buffer-keypair.json \
    --url https://solana-devnet.g.alchemy.com/v2/61IsKIeSrqAmU4FFb2vNaEm22I07hVv- \
    --commitment finalized
  
  RUST_LOG=debug,solana_client=debug,solana_runtime=debug \
  solana program deploy \
    --buffer 6kxiY1Tr9BCKtfJ8sfBuGn4KFVah2wmFQ4MAMuZwFPFb \
    --program-id target/deploy/fall-keypair.json \
    --url https://solana-devnet.g.alchemy.com/v2/61IsKIeSrqAmU4FFb2vNaEm22I07hVv- \
    --commitment finalized

# 升级程序
anchor upgrade \
  --program-id $PROGRAM_ID \
  --provider.cluster localnet \
  target/deploy/fall.so

anchor upgrade \
  --program-id CwCFw1cE5gCS5Twt1dCpov7XmsH8W6bdvPwstzDf7bn \
  --provider.cluster devnet \
  target/deploy/fall.so
  

# 查看程序信息
solana program show <PROGRAM_ID>

# 关闭程序并返回 rent exemption（租金豁免）危险！程序关闭后将永远无法被调用，这是一个不可逆的操作。
solana program close PROGRAM_ID --bypass-warning
solana program close FXTsM5vPjDp7nbnKfVMRrWzsRBztP3wN61rE92Gak44V --bypass-warning

############################# app ############################
cd fall
mkdir app

npm create vite@latest app -- --template react-ts

cd app
npm install

# 安装 Solana 相关依赖
npm install \
  @solana/web3.js \
  @project-serum/anchor \
  @solana/wallet-adapter-react \
  @solana/wallet-adapter-wallets \
  @solana/wallet-adapter-react-ui \
  @solana/wallet-adapter-base

npm run dev

