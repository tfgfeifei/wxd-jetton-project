import { Address, toNano } from '@ton/core';
import { JettonMinter } from '../wrappers/JettonMinter';
import { NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // !!! 这一行非常重要，请在这里替换为您的 Jetton Minter 合约的实际地址 !!!
    // 这个地址将在您成功运行 deploy.ts 脚本并部署 Minter 合约后，在终端中显示。
    // 现在，您可以暂时保持这个示例地址，但在实际铸造前务必替换！
    const minterAddress = Address.parse('EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c'); // **示例地址，部署后务必替换！**

    const jettonMinter = provider.open(JettonMinter.fromAddress(minterAddress));

    // 您想要铸造的 WXD 代币数量 (例如 1 亿个 WXD 代币)
    // toNano(100_000_000) 表示 100,000,000 个代币，考虑到 Jetton 通常有 9 位小数精度
    const amountToMint = toNano(100_000_000); // 铸造 1 亿个 WXD 代币


    // 接收这些新铸造代币的钱包地址 (通常是您自己的 MyTonWallet 地址)
    const destinationAddress = provider.sender().address!;
    // 例如：如果您想硬编码接收地址：
    // const destinationAddress = Address.parse('kQ...您的接收钱包地址...');

    console.log(`正在从 ${minterAddress.toString()} 铸造 ${amountToMint / toNano('1')} 个 WXD 到 ${destinationAddress.toString()}...`);

    // 发送铸造消息给 Minter 合约
    // toNano('0.02') 是本次铸造交易需要附加的 TON 费用 (用于链上 Gas 和少量余额)
    await jettonMinter.sendMint(provider.sender(), amountToMint, destinationAddress, toNano('0.02'));

    console.log('铸造请求已发送。请在您的钱包中确认交易。');
}