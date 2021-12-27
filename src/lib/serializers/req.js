import bunyan from 'bunyan';

function reqSerializer (req) {
  return bunyan.stdSerializers.req(req);
}

export default reqSerializer;
