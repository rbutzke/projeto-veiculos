import { connect } from 'amqplib';

async function testRabbitMQ() {
  try {
    const connection = await connect('amqp://guest:guest@localhost:5672');
    console.log('✅ Conexão com RabbitMQ estabelecida');
    
    const channel = await connection.createChannel();
    console.log('✅ Canal criado');
    
    // Declara a fila
    await channel.assertQueue('payment_queue', { durable: true });
    console.log('✅ Fila payment_queue verificada/criada');
    
    // Envia uma mensagem de teste
    const testMessage = {
      test: 'mensagem de teste',
      timestamp: new Date().toISOString()
    };
    
    channel.sendToQueue(
      'payment_queue',
      Buffer.from(JSON.stringify(testMessage)),
      { persistent: true }
    );
    
    console.log('✅ Mensagem de teste enviada:', testMessage);
    
    // Fecha conexão
    setTimeout(async () => {
      await channel.close();
      await connection.close();
      console.log('✅ Conexão fechada');
      process.exit(0);
    }, 1000);
    
  } catch (error) {
    console.error('❌ Erro ao conectar com RabbitMQ:', error.message);
    process.exit(1);
  }
}

testRabbitMQ();