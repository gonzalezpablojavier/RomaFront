import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Paper,
  Typography,
  Avatar,
  CircularProgress,
  Snackbar,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { SelectChangeEvent } from '@mui/material';



const GreyBackground = styled('div')(({ theme }) => ({
  backgroundColor: theme.palette.grey[50], // Un gris más oscuro para el fondo
  minHeight: '50vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(0),
}));

interface FormData {
  nombre: string;
  apellido: string;
  fechaNacimiento: string;
  miFamilia: string;
  direccion: string;
  localidad: string;
  sucursal: string;
  area: string;
  cuil: string;
  foto: string;
  colaboradorID: string;
  pass: string;
  email: string;
  empresaId: string;
  codpostal?: string;
  telefono?: string;
  fechaActualizado?: string; // Agrega esta línea
}

const initialState: FormData = {
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  miFamilia: '',
  direccion: '',
  localidad: '',
  sucursal: '',
  area: '',
  cuil: '',
  foto: '',
  colaboradorID: '',
  pass: '',
  email: '',
  empresaId: '',
  codpostal: '',
  telefono: '',
  fechaActualizado: '', // Agrega esta línea
};

const areas = ['Sistemas', 'Administración', 'Depósito', 'Comercial', 'GerenciaOP', 'Contabilidad', 'Compras', 'TV', 'Gerencia', 'Aoki'];
const sucursales = ['PICO', 'MDP', 'DIMES', 'ROSARIO'];

const Input = styled('input')({
  display: 'none',
});

const RegistroUsuario: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialState);
  const [solicitudEnviada, setSolicitudEnviada] = useState<boolean>(false);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [colaboradorIDExiste, setColaboradorIDExiste] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const API_URL = `${import.meta.env.VITE_API_DISTRI_API}`;;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [empresaId, setEmpresaID] = useState<string | null>(null);

  const fetchUserData = useCallback(async (colaboradorID: string, empresaId: string) => {
    try {
      const config = {
        headers: { 'x-empresa-id': empresaId }
      };
      const response = await axios.get<{ ok: number; data: FormData }>(`${API_URL}/usuarios-registrados/${colaboradorID}`, config);
      if (response.data.ok === 1) {
        setFormData({ ...response.data.data, empresaId });
        setColaboradorIDExiste(true);
        if (response.data.data.foto) {
          setFotoPreview(response.data.data.foto);
        }
      } else {
        console.log('No se encontró el colaboradorID, se creará uno nuevo.');
        setColaboradorIDExiste(false);
      }
    } catch (error) {
      console.error('Error al verificar el colaboradorID:', error);
      setColaboradorIDExiste(false);
      setError('No se pudo verificar el ID del colaborador. Por favor, intenta de nuevo.');
      setOpenSnackbar(true);
    }
  }, [API_URL]);


  useEffect(() => {
    const user = ((localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null) as { user_code: string | null })?.user_code;
    const colaboradorID = user;
    const storedEmpresa = localStorage.getItem('l_empresa_id');
    if (colaboradorID && storedEmpresa) {
      setFormData((prevData) => ({ ...prevData, colaboradorID, empresaId: storedEmpresa }));
      fetchUserData(colaboradorID, storedEmpresa);
    }


    if (storedEmpresa) {
      try {
        console.log(storedEmpresa);
        setEmpresaID(storedEmpresa);
      } catch (error) {
        console.error('Error parsing empresa data:', error);
        // Manejar el error
      }
    }
    // Configurar actualización automática cada 5 minutos
    const intervalId = setInterval(() => {
      setRefreshKey(oldKey => oldKey + 1);
    }, 300000); // 5 minutos

    return () => clearInterval(intervalId);
  }, [fetchUserData, refreshKey]);

  const verificarColaboradorID = async (colaboradorID: string) => {
    try {
      const config = {
        headers: { 'x-empresa-id': empresaId }
      };
      const response = await axios.get<{ ok: number; data: FormData }>(`${API_URL}/usuarios-registrados/${colaboradorID}`, config);
      if (response.data.ok === 1) {
        setFormData(response.data.data);
        setColaboradorIDExiste(true);
        if (response.data.data.foto) {
          setFotoPreview(response.data.data.foto);
        }
      } else {
        console.log('No se encontró el colaboradorID, se creará uno nuevo.');
        setColaboradorIDExiste(false);
      }
    } catch (error) {
      console.error('Error al verificar el colaboradorID:', error);
      setColaboradorIDExiste(false);
      setError('No se pudo verificar el ID del colaborador. Por favor, intenta de nuevo.');
      setOpenSnackbar(true);
    }
  };



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const uploadImage = async (file: File, colaboradorID: string): Promise<string> => {
    const formData = new FormData();
    formData.append('foto', file);
    formData.append('colaboradorID', colaboradorID);

    try {

      setIsUploadingPhoto(true);
      const response = await axios.post<{ ok: number; message: string; data: { fotoUrl: string } }>(
        `${API_URL}/usuarios-registrados/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', 'x-empresa-id': empresaId!
          }
        }
      );

      if (response.data.ok !== 1) {
        throw new Error(response.data.message);
      }

      console.log('Imagen subida con éxito:', response.data);
      return response.data.data.fotoUrl;
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      throw error;
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFotoFile(null);
      setFotoPreview(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!empresaId) {
      setError('No se ha especificado una empresa.');
      setOpenSnackbar(true);
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      let imageUrl = formData.foto;


      if (fotoFile && formData.colaboradorID) {
        imageUrl = await uploadImage(fotoFile, formData.colaboradorID);
      }

      const userData: FormData = {
        ...formData,
        foto: imageUrl,
        empresaId: empresaId,
        fechaActualizado: new Date().toISOString(), // Fuerza la actualización del campo
      };
      const config = {
        headers: { 'x-empresa-id': empresaId }
      };
      if (colaboradorIDExiste) {
        await axios.put(`${API_URL}/usuarios-registrados/${formData.colaboradorID}`, userData, config);
      } else {
        const response = await axios.post<FormData>(`${API_URL}/usuarios-registrados/create-if-not-exists/`, userData, config);
        setFormData(response.data);
      }
      console.log(userData);
      setSolicitudEnviada(true);
      setOpenSnackbar(true);
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      setError('Hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.');
      setOpenSnackbar(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setSolicitudEnviada(false);
  };

  const handleCloseSnackbar = (event: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  return (
    <GreyBackground>
      <Grid container justifyContent="center" alignItems="center" style={{ minHeight: '100vh' }}>

        <Grid item xs={12} sm={8} md={6}>
          <GreyBackground>
            <Paper elevation={3} style={{ padding: '2rem', marginTop: '2rem' }}>
              <Typography variant="h4" align="center" gutterBottom>
                {solicitudEnviada ? 'Datos del Registro' : 'Mi Usuario'}
              </Typography>

              <Grid container justifyContent="center" style={{ marginBottom: '1rem' }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="raised-button-file"
                  type="file"
                  onChange={handleFileChange}
                />
                <label htmlFor="raised-button-file">
                  <IconButton color="primary" aria-label="upload picture" component="span" onClick={handleImageClick}>
                    {fotoPreview ? (
                      <Avatar src={fotoPreview} style={{ width: 100, height: 100 }} />
                    ) : (
                      <Avatar style={{ width: 100, height: 100 }}>
                        <AddAPhotoIcon />
                      </Avatar>
                    )}
                  </IconButton>
                </label>
                {isUploadingPhoto && <CircularProgress size={24} style={{ marginLeft: 15 }} />}
              </Grid>

              {!solicitudEnviada ? (

                <form onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Apellido"
                        name="apellido"
                        value={formData.apellido}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="area-label">Área</InputLabel>
                        <Select
                          labelId="area-label"
                          name="area"
                          disabled
                          value={formData.area}
                          onChange={handleChange}
                          required
                        >
                          {areas.map((area) => (
                            <MenuItem key={area} value={area}>{area}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Sucursal</InputLabel>
                        <Select
                          name="sucursal"
                          value={formData.sucursal}
                          onChange={handleChange}
                          required
                        >
                          {sucursales.map((sucursal) => (
                            <MenuItem key={sucursal} value={sucursal}>{sucursal}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </Grid>


                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="telefono"
                        name="telefono"                      
                        value={formData.telefono}
                        onChange={handleChange}
                        required
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Fecha de Nacimiento"
                        name="fechaNacimiento"
                        type="date"
                        value={formData.fechaNacimiento}
                        onChange={handleChange}
                        InputLabelProps={{
                          shrink: true,
                        }}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="DNI"
                        name="cuil"
                        value={formData.cuil}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}  sm={6}>
                      <TextField
                        fullWidth
                        label="Domicilio"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleChange}
                        required
                      />
                    </Grid>

                    <Grid item xs={12}  sm={6}>
                      <TextField
                        fullWidth
                        label="localidad"
                        name="localidad"
                        value={formData.localidad}
                        onChange={handleChange}
                        required
                      />
                    </Grid>

                    
                    <Grid item xs={12}  sm={6}>
                      <TextField
                        fullWidth
                        label="Cod Postal"
                        name="codpostal"
                        value={formData.codpostal}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Más sobre mi"
                        name="miFamilia"
                        multiline
                        rows={2}
                        value={formData.miFamilia}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                  </Grid>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    style={{ marginTop: '1rem' }}
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Enviar'}
                  </Button>
                </form>



              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography><strong>Nombre:</strong> {formData.nombre}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography><strong>Apellido:</strong> {formData.apellido}</Typography>
                  </Grid>


                  <Grid item xs={12}>
                    <Typography><strong>Dirección:</strong> {formData.direccion}</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography><strong>Sucursal:</strong> {formData.sucursal}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography><strong>Área:</strong> {formData.area}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography><strong>DNI:</strong> {formData.cuil}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography><strong>Email:</strong> {formData.email}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography><strong>Más sobre mi:</strong> {formData.miFamilia}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="secondary"
                      onClick={handleEdit}
                    >
                      Editar
                    </Button>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </GreyBackground>
        </Grid>

        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          message={error || "Operación completada con éxito"}
          action={
            <React.Fragment>
              <IconButton
                size="small"
                aria-label="close"
                color="inherit"
                onClick={handleCloseSnackbar}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </React.Fragment>
          }
        />
      </Grid>
    </GreyBackground>
  );
};

export default RegistroUsuario;