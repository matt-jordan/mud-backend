import bunyan from 'bunyan';

function errSerializer (err) {
  return bunyan.stdSerializers.err(err);
}

export default errSerializer;
